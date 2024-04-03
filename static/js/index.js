~(function () {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    document.documentElement.classList.add('dark');
  }
  const defaultTitle = '飞鸽传书，阅后即焚';
  const loadingMask = document.querySelector('.loading_mask'),
    tBox = document.querySelector('.text_box'),
    tText = tBox.querySelector('textarea'),
    tSub = tBox.querySelector('button'),
    qBox = document.querySelector('.qr_box'),
    qText = qBox.querySelector('p'),
    qImg = qBox.querySelector('img'),
    qBtn = qBox.querySelectorAll('button'),
    rBox = document.querySelector('.read_box'),
    rText = rBox.querySelector('p'),
    rBtn = rBox.querySelectorAll('button'),
    logo = document.querySelector('.logo'),
    title = document.querySelector('.title'),
    github = document.querySelector('.github');
  title.innerText = defaultTitle;

  const { HASH } = queryURLParams(window.location.href);
  if (HASH) {
    show(rBox);
  } else {
    show(tBox);
  }
  github.addEventListener('click', () => {
    window.location.href = 'https://github.com/hellohechang/dove';
  });
  logo.addEventListener('click', function () {
    window.location.href = '/';
  });
  tSub.addEventListener('click', function () {
    const text = tText.value.trim();
    if (text == '') return;
    postReq('/w', { data: text })
      .then((res) => {
        if (res.code == 0) {
          tText.value = '';
          hide(tBox);
          const url = `${window.location.href}#${res.data}`;
          qText.innerText = url;
          qImg.src = jrQrcode.getQrBase64(url, { width: 500, height: 500 });
          show(qBox);
          _msg.success('创建成功');
          return;
        }
        _msg.error(res.data);
      })
      .catch(() => {});
  });
  qBtn[0].addEventListener('click', function () {
    hide(qBox);
    show(tBox);
  });
  qBtn[1].addEventListener('click', function () {
    copyText(qText.innerText);
  });
  rBtn[0].addEventListener('click', function () {
    getReq(`/r?id=${HASH}`)
      .then((res) => {
        hide(rBtn[0]);
        if (res.code == 0) {
          show(rBtn[1]);
          rText.innerText = res.data;
          show(rText);
          return;
        }
        _msg.error(res.data);
      })
      .catch(() => {});
  });
  rBtn[1].addEventListener('click', function () {
    copyText(rText.innerText);
  });
  function queryURLParams(url) {
    let obj = {};
    url.replace(/([^?=&#]+)=([^?=&#]+)/g, (...[, $1, $2]) => (obj[$1] = $2));
    url.replace(/#([^?=&#]+)/g, (...[, $1]) => (obj['HASH'] = $1));
    return obj;
  }
  function show(target) {
    target.style.display = 'flex';
  }
  function hide(target) {
    target.style.display = 'none';
  }
  const _msg = {
    timer: null,
    success(text) {
      text = '：' + text;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      title.innerText = text;
      title.classList.add('success');
      this.timer = setTimeout(() => {
        title.innerText = defaultTitle;
        title.classList.remove('success');
      }, 2000);
    },
    error(text) {
      text = '：' + text;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      title.innerText = text;
      title.classList.add('error');
      this.timer = setTimeout(() => {
        title.innerText = defaultTitle;
        title.classList.remove('error');
      }, 2000);
    },
  };
  async function copyText(content, obj = {}) {
    let { success, error } = obj;
    content = content.trim();
    try {
      if (!navigator.clipboard) {
        throw new Error();
      }
      await navigator.clipboard.writeText(content);
      _msg.success(success || '复制成功');
    } catch (err) {
      if (typeof document.execCommand !== 'function') {
        _msg.error(error || '复制失败');
        return;
      }
      window.getSelection().removeAllRanges();
      let div = document.createElement('div'),
        range = document.createRange();
      div.innerText = content;
      div.setAttribute(
        'style',
        'position: fixed;height: 1px;fontSize: 1px;overflow: hidden;'
      );
      document.body.appendChild(div);
      range.selectNode(div);
      window.getSelection().addRange(range);
      document.execCommand('copy');
      div.remove();
      _msg.success(success || '复制成功');
    }
  }
  async function postReq(url, data) {
    try {
      _loadingBar.start();
      const res = await _fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify(data),
      });
      _loadingBar.end();
      return res.json();
    } catch (error) {
      _loadingBar.end();
      _msg.error('请求失败');
      return Promise.reject(error);
    }
  }
  async function getReq(url) {
    try {
      _loadingBar.start();
      const res = await _fetch(url);
      _loadingBar.end();
      return res.json();
    } catch (error) {
      _loadingBar.end();
      _msg.error('请求失败');
      return Promise.reject(error);
    }
  }
  async function _fetch(url, options = {}) {
    const { timeout = 1000 * 10 } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  }
  class LoadingBar {
    constructor(options) {
      this.num = 0;
      this.init(options);
    }
    init(options) {
      let defaultobj = {
        color: 'red',
        size: '3',
        setStart: null,
        setEnd: null,
        zIndex: 999,
      };
      this.options = Object.assign(defaultobj, options);
      this.render();
    }
    render() {
      this.el = document.createElement('div');
      let { color, size, zIndex } = this.options;
      this.el.style.cssText = `
      display: 'none';
      height: ${size}px;
      background-color: ${color};
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      border-radio:20px;
      pointer-events: none;
      z-index: ${zIndex};
      background-image: linear-gradient(to right,Orange 90%, red);`;
      document.body.appendChild(this.el);
    }
    start() {
      this.num++;
      if (this.num === 1) {
        this.el.style.display = 'block';
        this.el.style.transition = 'none';
        this.el.style.width = '0';
        this.el.clientHeight;
        this.el.style.transition = '10s ease-in-out';
        this.el.style.width = '100%';
        this.options.setStart && this.options.setStart();
      }
    }
    end() {
      this.num--;
      this.num <= 0 ? (this.num = 0) : null;
      if (this.num === 0) {
        this.el.style.transition = 'none';
        this.el.style.width = '0';
        this.el.style.display = 'none';
        this.options.setEnd && this.options.setEnd();
      }
    }
  }
  const _loadingBar = new LoadingBar({
    color: 'red',
    size: '3',
    zIndex: 999,
    setStart() {
      show(loadingMask);
    },
    setEnd() {
      hide(loadingMask);
    },
  });
})();
