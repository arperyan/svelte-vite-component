function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
let is_hydrating = false;
function start_hydrating() {
  is_hydrating = true;
}
function end_hydrating() {
  is_hydrating = false;
}
function upper_bound(low, high, key, value) {
  while (low < high) {
    const mid = low + (high - low >> 1);
    if (key(mid) <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
function init_hydrate(target) {
  if (target.hydrate_init)
    return;
  target.hydrate_init = true;
  const children2 = target.childNodes;
  const m = new Int32Array(children2.length + 1);
  const p = new Int32Array(children2.length);
  m[0] = -1;
  let longest = 0;
  for (let i = 0; i < children2.length; i++) {
    const current = children2[i].claim_order;
    const seqLen = upper_bound(1, longest + 1, (idx) => children2[m[idx]].claim_order, current) - 1;
    p[i] = m[seqLen] + 1;
    const newLen = seqLen + 1;
    m[newLen] = i;
    longest = Math.max(newLen, longest);
  }
  const lis = [];
  const toMove = [];
  let last = children2.length - 1;
  for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
    lis.push(children2[cur - 1]);
    for (; last >= cur; last--) {
      toMove.push(children2[last]);
    }
    last--;
  }
  for (; last >= 0; last--) {
    toMove.push(children2[last]);
  }
  lis.reverse();
  toMove.sort((a, b) => a.claim_order - b.claim_order);
  for (let i = 0, j = 0; i < toMove.length; i++) {
    while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
      j++;
    }
    const anchor = j < lis.length ? lis[j] : null;
    target.insertBefore(toMove[i], anchor);
  }
}
function append(target, node) {
  if (is_hydrating) {
    init_hydrate(target);
    if (target.actual_end_child === void 0 || target.actual_end_child !== null && target.actual_end_child.parentElement !== target) {
      target.actual_end_child = target.firstChild;
    }
    if (node !== target.actual_end_child) {
      target.insertBefore(node, target.actual_end_child);
    } else {
      target.actual_end_child = node.nextSibling;
    }
  } else if (node.parentNode !== target) {
    target.appendChild(node);
  }
}
function insert(target, node, anchor) {
  if (is_hydrating && !anchor) {
    append(target, node);
  } else if (node.parentNode !== target || node.nextSibling != anchor) {
    target.insertBefore(node, anchor || null);
  }
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.wholeText !== data)
    text2.data = data;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
  if (flushing)
    return;
  flushing = true;
  do {
    for (let i = 0; i < dirty_components.length; i += 1) {
      const component = dirty_components[i];
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  flushing = false;
  seen_callbacks.clear();
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = new Set();
let outros;
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  }
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(parent_component ? parent_component.$$.context : options.context || []),
    callbacks: blank_object(),
    dirty,
    skip_bound: false
  };
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      start_hydrating();
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    end_hydrating();
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
var logo = "data:image/png;base64,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";
function add_css$1() {
  var style = element("style");
  style.id = "svelte-rb0bwp-style";
  style.textContent = "button.svelte-rb0bwp{font-family:inherit;font-size:inherit;padding:1em 2em;color:blue;background-color:pink;border-radius:2em;border:2px solid rgba(255, 62, 0, 0);outline:none;width:200px;font-variant-numeric:tabular-nums;cursor:pointer}button.svelte-rb0bwp:focus{border:2px solid #ff3e00}button.svelte-rb0bwp:active{background-color:rgba(255, 62, 0, 0.2)}";
  append(document.head, style);
}
function create_fragment$1(ctx) {
  let button;
  let t0;
  let t1;
  let mounted;
  let dispose;
  return {
    c() {
      button = element("button");
      t0 = text("Clicks: ");
      t1 = text(ctx[0]);
      attr(button, "class", "svelte-rb0bwp");
    },
    m(target, anchor) {
      insert(target, button, anchor);
      append(button, t0);
      append(button, t1);
      if (!mounted) {
        dispose = listen(button, "click", ctx[1]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & 1)
        set_data(t1, ctx2[0]);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(button);
      mounted = false;
      dispose();
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let count = 0;
  const increment = () => {
    $$invalidate(0, count += 1);
  };
  return [count, increment];
}
class Counter extends SvelteComponent {
  constructor(options) {
    super();
    if (!document.getElementById("svelte-rb0bwp-style"))
      add_css$1();
    init(this, options, instance, create_fragment$1, safe_not_equal, {});
  }
}
function add_css() {
  var style = element("style");
  style.id = "svelte-1fm71xa-style";
  style.textContent = ":root{font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,\n      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif}main.svelte-1fm71xa{text-align:center;padding:1em;margin:0 auto}img.svelte-1fm71xa{height:16rem;width:16rem}h1.svelte-1fm71xa{color:#ff3e00;text-transform:uppercase;font-size:4rem;font-weight:100;line-height:1.1;margin:2rem auto;max-width:14rem}p.svelte-1fm71xa{max-width:14rem;margin:1rem auto;line-height:1.35}@media(min-width: 480px){h1.svelte-1fm71xa{max-width:none}p.svelte-1fm71xa{max-width:none}}";
  append(document.head, style);
}
function create_fragment(ctx) {
  let main;
  let img;
  let img_src_value;
  let t0;
  let h1;
  let t2;
  let counter;
  let t3;
  let p0;
  let t7;
  let p1;
  let current;
  counter = new Counter({});
  return {
    c() {
      main = element("main");
      img = element("img");
      t0 = space();
      h1 = element("h1");
      h1.textContent = "Hello Typescript!";
      t2 = space();
      create_component(counter.$$.fragment);
      t3 = space();
      p0 = element("p");
      p0.innerHTML = `Visit <a href="https://svelte.dev" class="svelte-1fm71xa">svelte.dev</a> to learn how to build Svelte
    apps.`;
      t7 = space();
      p1 = element("p");
      p1.innerHTML = `Check out <a href="https://github.com/sveltejs/kit#readme" class="svelte-1fm71xa">SvelteKit</a> for
    the officially supported framework, also powered by Vite!`;
      if (img.src !== (img_src_value = logo))
        attr(img, "src", img_src_value);
      attr(img, "alt", "Svelte Logo");
      attr(img, "class", "svelte-1fm71xa");
      attr(h1, "class", "svelte-1fm71xa");
      attr(p0, "class", "svelte-1fm71xa");
      attr(p1, "class", "svelte-1fm71xa");
      attr(main, "class", "svelte-1fm71xa");
    },
    m(target, anchor) {
      insert(target, main, anchor);
      append(main, img);
      append(main, t0);
      append(main, h1);
      append(main, t2);
      mount_component(counter, main, null);
      append(main, t3);
      append(main, p0);
      append(main, t7);
      append(main, p1);
      current = true;
    },
    p: noop,
    i(local) {
      if (current)
        return;
      transition_in(counter.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(counter.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(main);
      destroy_component(counter);
    }
  };
}
class App extends SvelteComponent {
  constructor(options) {
    super();
    if (!document.getElementById("svelte-1fm71xa-style"))
      add_css();
    init(this, options, null, create_fragment, safe_not_equal, {});
  }
}
export { App as default };
