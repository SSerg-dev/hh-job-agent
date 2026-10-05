import type { ManualResult } from '../shared/manual.ts';
import type { ImportedVacancy } from '../server/hh-import.ts';
import type { LetterInfo } from '../shared/letter.ts';
const esc = (x: unknown) => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const letterInfo = (info?: LetterInfo) => info ? `<p>Источники: ${esc(info.sources.join(', ') || 'краткий профиль')}</p>${info.warnings.map(w => `<p class="mt-2">${esc(w)}</p>`).join('')}` : '<p>Это ранее сохранённое письмо. Пересоздайте его, чтобы использовать документы.</p>';
export async function manualView(shell: (s: string) => void, lettersOnly = false) {
  shell('<section class="card" role="status">Загружаем ручные вакансии…</section>');
  const request = async <T>(method: string, value?: unknown, endpoint = '/api/manual', signal?: AbortSignal): Promise<T> => { const r = await fetch(endpoint, { method, signal, headers: value ? { 'Content-Type': 'application/json' } : {}, body: value ? JSON.stringify(value) : undefined }); const data = await r.json(); if (!r.ok) throw new Error(data.error); return data; };
  try {
    const entries = await request<ManualResult[]>('GET');
    const form = `<form id="manual-form" class="card space-y-4"><h2 class="text-lg font-semibold">Добавить вакансию</h2><label>Ссылка на вакансию HH<input name="sourceUrl" type="url" maxlength="2000" placeholder="https://spb.hh.ru/vacancy/137302282"></label><button class="secondary" id="import-vacancy" type="button">Заполнить по ссылке</button><p id="import-status" role="status" class="text-sm"></p><p class="text-xs muted">Данные сохраняются локально. Загрузка заменит все поля данными новой вакансии. Неизвестные значения останутся пустыми (—). Текст вакансии используется как данные, не как инструкции.</p><label>Название позиции<input name="name" required maxlength="300"></label><label>Компания<input name="employer" maxlength="300"></label><label>Полное описание<textarea name="description" rows="9" required maxlength="24000"></textarea></label><label>Город<select name="city"><option value="" selected>—</option><option value="2">Санкт-Петербург</option><option value="1">Москва</option><option value="other">Другой город / вне критериев</option></select></label><label>Формат<select name="format"><option value="">—</option><option value="REMOTE">Удалёнка</option><option value="HYBRID">Гибрид</option><option value="ON_SITE">Офис</option></select></label><label>Нижняя граница зарплаты, ₽ / месяц<input name="salary" type="number" min="1" max="10000000" step="1" placeholder="Оставь пустым, если не указана"></label><label>Налоги<select name="tax"><option value="">—</option><option value="net">На руки</option><option value="gross">До налогов</option></select></label><label>Перечисленные работодателем навыки, через запятую<input name="skills" maxlength="2000"></label><button class="btn" type="submit">Сохранить, оценить и подготовить письмо</button><button class="secondary" type="reset">Очистить форму</button><p id="manual-status" role="status" class="text-sm"></p></form>`;
    shell(`<p class="mb-5 text-sm muted">Ручной режим работает без HH API. Письмо составляется локально по подтверждённым фактам резюме, AI-стека и cover letter. Проверь его перед использованием. Отправки нет.</p><div class="grid gap-6 ${lettersOnly ? '' : 'xl:grid-cols-2'}">${lettersOnly ? '' : form}<section class="space-y-5">${entries.length ? entries.map(e => `<article class="card" data-entry="${e.id}"><h2 class="text-lg font-semibold">${esc(e.vacancy.name)}</h2><p class="mt-2 text-xs muted">${esc(e.vacancy.employer?.name)} · ${esc(e.vacancy.area.name)} · ${esc(e.match.formatLabel)}</p><p class="mt-3 font-medium">${esc(e.match.salaryLabel)}</p><p class="mt-3 text-sm font-semibold">${{ eligible: 'Соответствует критериям', review: 'Нужна проверка', rejected: 'Не подходит' }[e.match.decision]}</p><ul class="mt-2 space-y-2 text-xs">${e.match.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul><p class="mt-3 text-xs">Совпадения: ${esc(e.match.matchedSkills.join(', ') || 'не найдены')}</p><p class="mt-2 text-xs">Не подтверждено: ${esc(e.match.gaps.join(', ') || 'отдельные пробелы не выявлены; это не гарантия полного соответствия')}</p><details class="mt-4"><summary>Исходное описание</summary><p class="mt-3 whitespace-pre-wrap text-xs">${esc(e.vacancy.description)}</p></details><label class="mt-5 block">Черновик cover letter<textarea rows="12" maxlength="20000" data-letter="${e.id}">${esc(e.letter)}</textarea></label><div data-letter-info="${e.id}" class="mt-3 text-xs">${letterInfo(e.letterInfo)}</div><div class="mt-3 flex flex-wrap gap-3"><button class="secondary" data-regenerate="${e.id}">Пересоздать письмо по документам</button><button class="secondary" data-save="${e.id}">Сохранить письмо</button><button class="secondary" data-copy="${e.id}">Копировать</button><button class="secondary" data-delete="${e.id}">Удалить вакансию</button></div><p data-status="${e.id}" role="status" class="mt-2 text-xs"></p></article>`).join('') : '<div class="card">Ручных вакансий пока нет. Добавь первую в подборке вакансий.</div>'}</section></div>`);
    const formEl = document.querySelector<HTMLFormElement>('#manual-form');
    let importController: AbortController | undefined;
    let importVersion = 0;
    if (formEl) {
      const importButton = formEl.querySelector<HTMLButtonElement>('#import-vacancy')!;
      const importStatus = formEl.querySelector<HTMLElement>('#import-status')!;
      const controls = formEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>('input, select, textarea, button:not([type="reset"])');
      const setLoading = (loading: boolean) => controls.forEach(control => control.disabled = loading);
      formEl.onreset = () => {
        importVersion++; importController?.abort(); setLoading(false); importStatus.textContent = '';
        document.querySelector('#manual-status')!.textContent = 'Форма очищена. Можно добавить новую вакансию.';
      };
      importButton.onclick = async () => {
        const link = formEl.elements.namedItem('sourceUrl') as HTMLInputElement;
        if (!link.value.trim()) { importStatus.textContent = 'Вставьте ссылку на вакансию HH.'; link.focus(); return; }
        const version = ++importVersion;
        importController?.abort(); importController = new AbortController();
        setLoading(true); importStatus.textContent = 'Загружаем вакансию HH…';
        try {
          const data = await request<ImportedVacancy>('POST', { url: link.value }, '/api/manual/import', importController.signal);
          if (version !== importVersion || !formEl.isConnected) return;
          for (const key of ['name', 'employer', 'description', 'city', 'format', 'salary', 'tax', 'skills'] as const) {
            (formEl.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value = data[key];
          }
          link.value = data.sourceUrl;
          document.querySelector('#manual-status')!.textContent = '';
          importStatus.textContent = 'Поля заполнены. Проверьте данные и сохраните вакансию.' + (data.warnings.length ? ' ' + data.warnings.join(' ') : '');
        } catch (e) { if (version === importVersion && formEl.isConnected) importStatus.textContent = (e as Error).message; }
        finally { if (version === importVersion && formEl.isConnected) setLoading(false); }
      };
    }
    if (formEl) formEl.onsubmit = async event => { event.preventDefault(); const button = formEl.querySelector<HTMLButtonElement>('button[type="submit"]')!; button.disabled = true; try { await request('POST', Object.fromEntries(new FormData(formEl))); await manualView(shell); } catch (e) { document.querySelector('#manual-status')!.textContent = (e as Error).message; button.disabled = false; } };
    document.querySelectorAll<HTMLButtonElement>('[data-save], [data-copy]').forEach(button => button.onclick = async () => { const id = button.dataset.save ?? button.dataset.copy!; const status = document.querySelector(`[data-status="${id}"]`)!; const letter = document.querySelector<HTMLTextAreaElement>(`[data-letter="${id}"]`)!.value; button.disabled = true; try { if (button.dataset.save) { await request('PUT', { id, letter }); status.textContent = 'Письмо сохранено.'; } else { await navigator.clipboard.writeText(letter); status.textContent = 'Скопировано.'; } } catch (e) { status.textContent = (e as Error).message; } finally { button.disabled = false; } });
    document.querySelectorAll<HTMLButtonElement>('[data-regenerate]').forEach(button => button.onclick = async () => {
      const id = button.dataset.regenerate!;
      const card = document.querySelector<HTMLElement>(`[data-entry="${id}"]`)!;
      const status = card.querySelector<HTMLElement>('[data-status]')!;
      const controls = card.querySelectorAll<HTMLButtonElement>('button'); controls.forEach(control => control.disabled = true);
      try {
        const result = await request<{ letter: string; letterInfo: LetterInfo }>('POST', { id }, '/api/manual/letter');
        card.querySelector<HTMLTextAreaElement>('[data-letter]')!.value = result.letter;
        card.querySelector<HTMLElement>('[data-letter-info]')!.innerHTML = letterInfo(result.letterInfo);
        status.textContent = 'Письмо пересоздано и сохранено. Предыдущий текст заменён.';
      } catch (e) { status.textContent = (e as Error).message; }
      finally { controls.forEach(control => control.disabled = false); }
    });
    document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(button => button.onclick = async () => {
      const id = button.dataset.delete!;
      const card = document.querySelector<HTMLElement>(`[data-entry="${id}"]`)!;
      const status = card.querySelector<HTMLElement>('[data-status]')!;
      const controls = card.querySelectorAll<HTMLButtonElement>('button');
      controls.forEach(control => control.disabled = true);
      try {
        await request('DELETE', { id });
        const list = card.parentElement!;
        card.remove();
        if (!list.querySelector('[data-entry]')) list.innerHTML = '<div class="card" role="status">Ручных вакансий пока нет. Добавь новую в подборке вакансий.</div>';
        if (formEl) document.querySelector('#manual-status')!.textContent = 'Вакансия и её письмо удалены. Можно добавить новую вакансию.';
      } catch (e) { status.textContent = (e as Error).message; controls.forEach(control => control.disabled = false); }
    });
  } catch (e) { shell(`<section class="card" role="alert">${esc((e as Error).message)}</section>`); }
}
