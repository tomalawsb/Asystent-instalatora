/*
 * Pomocnik Instalatora PWA — etap 6: proces wyceny i interfejs mobilny.
 * Ten modul nie zmienia parsera, obliczen ani zapisu danych.
 */

(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 850;
  const STEP_META = {
    1: {
      title: 'Opis wizyty',
      counter: 'Krok 1 z 4',
      next: 'Dalej: weryfikacja',
      mobileNext: 'Dalej',
      mobileAria: 'Przejdź do weryfikacji danych',
      hint: 'Dodaj opis wizyty albo przejdź dalej.'
    },
    2: {
      title: 'Weryfikacja danych',
      counter: 'Krok 2 z 4',
      next: 'Dalej: wycena',
      mobileNext: 'Dalej',
      mobileAria: 'Przejdź do pozycji i cen',
      hint: 'Sprawdź dane klienta i zatwierdź wynik analizy.'
    },
    3: {
      title: 'Pozycje i ceny',
      counter: 'Krok 3 z 4',
      next: 'Dalej: finalizacja',
      mobileNext: 'Finalizacja',
      mobileAria: 'Przejdź do finalizacji wyceny',
      hint: 'Uzupełnij pozycje, ceny i koszt dojazdu.'
    },
    4: {
      title: 'Finalizacja',
      counter: 'Krok 4 z 4',
      next: 'Finalizacja',
      mobileNext: 'Zapisz wycenę',
      mobileAria: 'Zapisz aktualną wycenę',
      hint: 'Sprawdź dokumenty i zapisz wycenę.'
    }
  };

  let activeWorkflowStep = 1;

  function getElement(id) {
    return document.getElementById(id);
  }

  function isMobileLayout() {
    return window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ?? window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function serviceCount() {
    if (typeof state !== 'undefined' && Array.isArray(state.services)) return state.services.length;
    return document.querySelectorAll('#servicesBody tr').length;
  }

  function hasVoiceText() {
    return Boolean(String(getElement('voiceCommand')?.value || '').trim());
  }

  function parserIsVisible() {
    const preview = getElement('parserPreview');
    return Boolean(preview && !preview.hidden);
  }

  function updateStepStatuses() {
    const count = serviceCount();
    const statuses = {
      1: hasVoiceText() ? 'Gotowy' : (activeWorkflowStep === 1 ? 'Teraz' : 'Oczekuje'),
      2: parserIsVisible() ? 'Sprawdź' : (count > 0 ? 'Gotowy' : (activeWorkflowStep === 2 ? 'Teraz' : 'Oczekuje')),
      3: count > 0 ? `${count} ${count === 1 ? 'pozycja' : count < 5 ? 'pozycje' : 'pozycji'}` : (activeWorkflowStep === 3 ? 'Teraz' : 'Oczekuje'),
      4: count > 0 ? 'Gotowe' : (activeWorkflowStep === 4 ? 'Teraz' : 'Oczekuje')
    };

    for (let step = 1; step <= 4; step += 1) {
      const status = getElement(`step${step}Status`);
      if (status) status.textContent = statuses[step];
    }
  }

  function updateWorkflowMirrors() {
    const gross = getElement('sumGross')?.textContent || '0,00 zł';
    const client = String(getElement('clientName')?.value || '').trim();
    const address = String(getElement('clientAddress')?.value || '').trim();
    const count = serviceCount();

    const grossMirror = getElement('finalGrossMirror');
    if (grossMirror) grossMirror.textContent = gross;

    const clientMirror = getElement('finalClientMirror');
    if (clientMirror) {
      clientMirror.textContent = client || address
        ? [client || 'Klient bez nazwy', address].filter(Boolean).join(' — ')
        : 'Aktualna wycena';
    }

    const countLabel = getElement('workflowServicesCount');
    if (countLabel) {
      countLabel.textContent = `${count} ${count === 1 ? 'pozycja' : count > 1 && count < 5 ? 'pozycje' : 'pozycji'}`;
    }

    updateStepStatuses();
  }

  function updateParserWaitingState() {
    const waiting = getElement('parserWaitingState');
    if (waiting) waiting.hidden = parserIsVisible();
  }

  function centerActiveWorkflowStep(activeButton) {
    const container = document.querySelector('.workflow-steps');
    if (!container || !activeButton || container.scrollWidth <= container.clientWidth) return;

    const targetLeft = activeButton.offsetLeft - ((container.clientWidth - activeButton.offsetWidth) / 2);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function updateWorkflowActionBar(meta, normalized) {
    const actions = getElement('workflowActions');
    const next = getElement('workflowNextBtn');
    const mobilePrimary = getElement('mobileWorkflowPrimaryBtn');
    const prev = getElement('workflowPrevBtn');
    const hint = getElement('workflowActionHint');
    const mobileLabel = getElement('mobileWorkflowStepLabel');

    if (actions) {
      actions.dataset.step = String(normalized);
      actions.classList.toggle('is-final-step', normalized === 4);
    }
    if (hint) hint.textContent = meta.hint;
    if (mobileLabel) mobileLabel.textContent = meta.counter;
    if (prev) {
      prev.disabled = normalized === 1;
      prev.setAttribute('aria-label', normalized === 1 ? 'Jesteś na pierwszym kroku' : `Wróć do kroku ${normalized - 1}`);
    }
    if (next) {
      next.hidden = normalized === 4;
      next.textContent = meta.next;
    }
    if (mobilePrimary) {
      mobilePrimary.textContent = meta.mobileNext;
      mobilePrimary.setAttribute('aria-label', meta.mobileAria);
      mobilePrimary.dataset.action = normalized === 4 ? 'save' : 'next';
    }
  }

  function setWorkflowStep(step, options = {}) {
    const normalized = Math.max(1, Math.min(4, Number(step) || 1));
    const previous = activeWorkflowStep;
    activeWorkflowStep = normalized;

    document.querySelectorAll('[data-workflow-step]').forEach(panel => {
      const isActive = Number(panel.dataset.workflowStep) === normalized;
      panel.classList.toggle('active', isActive);
      panel.hidden = !isActive;
      panel.setAttribute('aria-hidden', String(!isActive));
    });

    let activeButton = null;
    document.querySelectorAll('[data-workflow-target]').forEach(button => {
      const buttonStep = Number(button.dataset.workflowTarget);
      const isActive = buttonStep === normalized;
      button.classList.toggle('active', isActive);
      button.classList.toggle('completed', buttonStep < normalized);
      button.setAttribute('aria-current', isActive ? 'step' : 'false');
      button.setAttribute('aria-label', `Krok ${buttonStep}: ${STEP_META[buttonStep].title}`);
      if (isActive) activeButton = button;
    });

    const meta = STEP_META[normalized];
    const counter = getElement('workflowStepCounter');
    const title = getElement('workflowStepTitle');

    if (counter) counter.textContent = meta.counter;
    if (title) title.textContent = meta.title;
    updateWorkflowActionBar(meta, normalized);
    updateParserWaitingState();
    updateWorkflowMirrors();

    if (isMobileLayout()) centerActiveWorkflowStep(activeButton);

    if (options.scroll !== false && previous !== normalized) {
      const heading = document.querySelector('.workflow-steps');
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      heading?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function runMobilePrimaryAction() {
    if (activeWorkflowStep === 4) {
      getElement('saveQuoteBtn')?.click();
      return;
    }
    setWorkflowStep(activeWorkflowStep + 1);
  }

  function initWorkflowNavigation() {
    document.querySelectorAll('[data-workflow-target]').forEach(button => {
      button.addEventListener('click', () => setWorkflowStep(button.dataset.workflowTarget));
    });

    getElement('workflowPrevBtn')?.addEventListener('click', () => setWorkflowStep(activeWorkflowStep - 1));
    getElement('workflowNextBtn')?.addEventListener('click', () => setWorkflowStep(activeWorkflowStep + 1));
    getElement('mobileWorkflowPrimaryBtn')?.addEventListener('click', runMobilePrimaryAction);

    getElement('newQuoteBtn')?.addEventListener('click', () => {
      window.setTimeout(() => {
        document.querySelector('[data-tab="quoteTab"]')?.click();
        setWorkflowStep(1);
      }, 0);
    });

    getElement('acceptParserBtn')?.addEventListener('click', () => {
      window.setTimeout(() => setWorkflowStep(3), 0);
    });

    getElement('rejectParserBtn')?.addEventListener('click', () => {
      window.setTimeout(() => setWorkflowStep(1), 0);
    });

    getElement('savedQuotes')?.addEventListener('click', event => {
      if (!event.target.closest('.load')) return;
      window.setTimeout(() => setWorkflowStep(3, { scroll: false }), 0);
    });

    getElement('catalogView')?.addEventListener('click', event => {
      if (!event.target.closest('[data-action="add"]')) return;
      window.setTimeout(() => setWorkflowStep(3, { scroll: false }), 0);
    });

    getElement('voiceCommand')?.addEventListener('input', updateStepStatuses);
    getElement('clientName')?.addEventListener('input', updateWorkflowMirrors);
    getElement('clientAddress')?.addEventListener('input', updateWorkflowMirrors);
  }

  function initParserObserver() {
    const preview = getElement('parserPreview');
    if (!preview) return;

    const observer = new MutationObserver(() => {
      updateParserWaitingState();
      updateStepStatuses();
      if (!preview.hidden && activeWorkflowStep === 1) {
        setWorkflowStep(2);
      }
    });

    observer.observe(preview, {
      attributes: true,
      attributeFilter: ['hidden', 'style', 'class'],
      childList: true,
      subtree: false
    });
  }

  function initValueObservers() {
    const observer = new MutationObserver(updateWorkflowMirrors);
    ['sumGross', 'sumNet', 'sumVat', 'servicesBody', 'serviceCards'].forEach(id => {
      const element = getElement(id);
      if (element) observer.observe(element, { childList: true, subtree: true, characterData: true });
    });
  }

  function activateMorePanel(targetId) {
    document.querySelectorAll('.more-nav-button').forEach(button => {
      const active = button.dataset.moreTarget === targetId;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.more-panel').forEach(panel => {
      const active = panel.id === targetId;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
  }

  function initMoreNavigation() {
    document.querySelectorAll('.more-nav-button').forEach(button => {
      button.addEventListener('click', () => activateMorePanel(button.dataset.moreTarget));
    });
    activateMorePanel('settingsTab');
  }

  function updateActionMenuState() {
    const anyOpen = Boolean(document.querySelector('details.action-menu[open]'));
    document.body.classList.toggle('action-menu-open', anyOpen && isMobileLayout());
  }

  function closeOtherActionMenus(activeMenu = null) {
    document.querySelectorAll('details.action-menu[open]').forEach(menu => {
      if (menu !== activeMenu) menu.open = false;
    });
    window.setTimeout(updateActionMenuState, 0);
  }

  function initActionMenus() {
    document.addEventListener('toggle', event => {
      const menu = event.target.closest?.('details.action-menu');
      if (!menu) return;
      if (menu.open) {
        closeOtherActionMenus(menu);
        if (isMobileLayout()) {
          window.setTimeout(() => menu.querySelector('.action-menu-content button')?.focus({ preventScroll: true }), 40);
        }
      }
      window.setTimeout(updateActionMenuState, 0);
    }, true);

    document.addEventListener('click', event => {
      const menuButton = event.target.closest('details.action-menu button');
      if (menuButton) {
        const menu = menuButton.closest('details.action-menu');
        window.setTimeout(() => {
          if (menu) menu.open = false;
          updateActionMenuState();
        }, 0);
        return;
      }
      if (!event.target.closest('details.action-menu')) closeOtherActionMenus();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const openMenu = document.querySelector('details.action-menu[open]');
      if (!openMenu) return;
      openMenu.open = false;
      openMenu.querySelector('summary')?.focus();
      updateActionMenuState();
    });
  }

  function improveMainNavigationAccessibility() {
    document.querySelectorAll('.main-navigation .tab').forEach(button => {
      button.setAttribute('aria-selected', String(button.classList.contains('active')));
      button.addEventListener('click', () => {
        closeOtherActionMenus();
        document.querySelectorAll('.main-navigation .tab').forEach(item => {
          item.setAttribute('aria-selected', String(item === button));
        });
      });
    });
  }

  function updateVisualViewportOffset() {
    const viewport = window.visualViewport;
    if (!viewport) {
      document.documentElement.style.setProperty('--mobile-keyboard-offset', '0px');
      return;
    }
    const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty('--mobile-keyboard-offset', `${Math.round(offset)}px`);
  }

  function initMobileViewportHandling() {
    updateVisualViewportOffset();
    window.visualViewport?.addEventListener('resize', updateVisualViewportOffset);
    window.visualViewport?.addEventListener('scroll', updateVisualViewportOffset);
    window.addEventListener('resize', () => {
      updateVisualViewportOffset();
      updateActionMenuState();
      const activeButton = document.querySelector('[data-workflow-target].active');
      if (isMobileLayout()) centerActiveWorkflowStep(activeButton);
    });
  }

  function initStage6Interface() {
    initWorkflowNavigation();
    initParserObserver();
    initValueObservers();
    initMoreNavigation();
    initActionMenus();
    improveMainNavigationAccessibility();
    initMobileViewportHandling();
    renderAnalysisModeHint(loadSettings());
    setWorkflowStep(1, { scroll: false });
    updateWorkflowMirrors();
  }

  document.addEventListener('DOMContentLoaded', initStage6Interface);

  window.setWorkflowStep = setWorkflowStep;
  window.getWorkflowStep = () => activeWorkflowStep;
}());
