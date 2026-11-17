const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
if (menu && navigation) {
  document.documentElement.classList.add('nav-enabled');
  menu.hidden = false;
  const setMenu = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  };
  menu.addEventListener('click', () => {
    setMenu(menu.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  navigation.addEventListener('click', (event) => {
    if (!event.target.closest('a') || menu.getAttribute('aria-expanded') !== 'true') return;
    setMenu(false);
    if (!menu.getClientRects().length) return;
    const link = event.target.closest('a');
    if (link.pathname === location.pathname && link.hash) {
      document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    }
  });
}

const header = document.querySelector('.site-header');
if (header) {
  let pending = false;
  function updateHeader() {
    pending = false;
    header.classList.toggle('is-scrolled', window.scrollY > 48);
  }
  function scheduleHeaderUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateHeader);
  }
  updateHeader();
  window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
  window.addEventListener('pageshow', updateHeader);
}

const filters = document.querySelector('[data-filters]');
if (filters) {
  const path = filters.querySelector('[name="path"]');
  const format = filters.querySelector('[name="type"]');
  const cards = [...document.querySelectorAll('[data-feed-item]')];
  const status = document.querySelector('[data-feed-status]');
  filters.hidden = false;
  filters.addEventListener('change', () => {
    cards.forEach((card) => {
      const pathMatches = !path.value || card.dataset.paths.split(' ').includes(path.value);
      const formatMatches = !format.value || card.dataset.type === format.value;
      card.hidden = !(pathMatches && formatMatches);
    });
    status.hidden = cards.some((card) => !card.hidden);
  });
}

const heritage = document.querySelector('[data-heritage-browser]');
if (heritage) {
  const list = heritage.querySelector('[data-heritage-tabs]');
  const tabs = Array.from(list.querySelectorAll('a'));
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  const show = (index) => {
    tabs.forEach((tab, i) => {
      const active = index === i;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
  };
  const syncToHash = () => {
    const target = document.getElementById(location.hash.slice(1));
    show(
      Math.max(
        0,
        panels.findIndex((panel) => target && panel.contains(target)),
      ),
    );
  };
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-orientation', 'horizontal');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (location.hash !== tab.hash) history.pushState(null, '', tab.hash);
      show(index);
    });
    tab.addEventListener('keydown', (event) => {
      const next = {
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (Number.isInteger(next)) {
        event.preventDefault();
        tabs[next].focus();
      } else if (event.key === ' ') {
        event.preventDefault();
        tab.click();
      }
    });
  });
  syncToHash();
  heritage.setAttribute('data-heritage-ready', '');
  window.addEventListener('hashchange', syncToHash);
  window.addEventListener('popstate', syncToHash);
}

if (
  'IntersectionObserver' in window &&
  matchMedia('(prefers-reduced-motion: no-preference)').matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('arrived');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -32px 0px' },
  );
  function observe(element, order) {
    // Content is visible until it enters from below; restored scroll positions and keyboard navigation stay readable.
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    if (order) element.style.setProperty('--reveal-order', Math.min(order, 2));
    observer.observe(element);
  }
  document.querySelectorAll('[data-reveal]').forEach((element) => {
    if (element.dataset.reveal === 'group') {
      Array.from(element.children).forEach((child, order) => {
        if (!child.hasAttribute('data-reveal')) observe(child, order);
      });
    } else {
      observe(element, 0);
    }
  });
}
