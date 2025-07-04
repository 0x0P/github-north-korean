// === 첫 번째 스크립트: 요소 재배치, 번역 및 GM_* 폴리필 관련 기능 ===
(function () {
  /*────────────────────────────────────────────
    1. .flex-1 내부 텍스트 재배치 (starred, forked, added a repository to, started following)
  ────────────────────────────────────────────*/
  function reorderFlexElements() {
    // 각 케이스에 대한 재배치 설정 (검색어, 사용자 링크 뒤에 삽입할 텍스트, 마지막에 삽입할 텍스트)
    const reorders = [
      { keyword: "starred", textBefore: "님이", textAfter: (text) => text },
      {
        keyword: "forked",
        textBefore: "님이 ",
        textAfter: (text) => " " + text.trim(),
      },
      {
        keyword: "added a repository to",
        textBefore: "님이",
        textAfter: (text) => text,
      },
      {
        keyword: "started following",
        textBefore: " 님이 ",
        textAfter: " started following",
      },
    ];

    // 모든 .flex-1 요소에 대해 재배치 처리
    const flexElements = document.querySelectorAll(".flex-1");
    flexElements.forEach((parent) => {
      // 각 케이스별로 검사하여 하나라도 일치하면 재배치 처리 후 break
      for (const { keyword, textBefore, textAfter } of reorders) {
        if (parent.textContent.includes(keyword)) {
          const shrinkElem = parent.querySelector(".flex-shrink-0");
          const overflowElem = parent.querySelector(".overflow-auto");
          if (!shrinkElem || !overflowElem) break;

          const anchor = shrinkElem.querySelector("a");
          if (!anchor) break;

          let targetTextNode = null;
          shrinkElem.childNodes.forEach((node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              node.textContent.includes(keyword)
            ) {
              targetTextNode = node;
            }
          });
          if (!targetTextNode) break;

          // 원래 부모에서 제거
          anchor.parentNode && anchor.parentNode.removeChild(anchor);
          targetTextNode.parentNode &&
            targetTextNode.parentNode.removeChild(targetTextNode);
          overflowElem.parentNode &&
            overflowElem.parentNode.removeChild(overflowElem);

          // 부모 내용을 초기화하고 새 순서대로 추가
          parent.innerHTML = "";
          parent.appendChild(anchor);
          parent.appendChild(document.createTextNode(textBefore));
          parent.appendChild(overflowElem);
          const afterContent =
            typeof textAfter === "function"
              ? textAfter(targetTextNode.textContent)
              : textAfter;
          parent.appendChild(document.createTextNode(afterContent));
          break; // 한 케이스 적용 후 더 이상 검사하지 않음.
        }
      }
    });
  }

  // DOM 변경시마다 재정렬하도록 MutationObserver 등록
  function initReorderFlexElements() {
    reorderFlexElements();
    const observer = new MutationObserver(() => reorderFlexElements());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReorderFlexElements);
  } else {
    initReorderFlexElements();
  }

  (function () {
    /**
     * div.f6.color-fg-muted.mt-2 요소 내에서 "Updated" 텍스트와 <relative-time> 요소의 순서를 교체합니다.
     * 원래 순서: "Updated" 텍스트 노드 → <relative-time> 요소
     * 변경 후: <relative-time> 요소 → "Updated" 텍스트 노드
     */
    function reorderUpdatedRelativeTime() {
      // 해당 클래스를 가진 모든 div를 찾습니다.
      const divs = document.querySelectorAll("div.f6.color-fg-muted.mt-2");

      divs.forEach((div) => {
        // <relative-time> 요소를 찾습니다.
        const relTime = div.querySelector("relative-time");
        if (!relTime) return;

        // div의 자식 노드 중 "Updated"라는 단어를 포함하는 텍스트 노드를 찾습니다.
        let updatedTextNode = null;
        div.childNodes.forEach((node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.includes("Updated")
          ) {
            updatedTextNode = node;
          }
        });
        if (!updatedTextNode) return;

        // 이미 순서가 바뀌었는지 확인합니다.
        const children = Array.from(div.childNodes);
        const idxUpdated = children.indexOf(updatedTextNode);
        const idxRelTime = children.indexOf(relTime);
        // 원래 순서는 updatedTextNode가 앞쪽에 있으므로, 만약 relative-time이 먼저 있다면 이미 변경된 것으로 판단.
        if (idxRelTime < idxUpdated) return;

        // 두 노드를 제거한 후, 바뀐 순서대로 다시 추가합니다.
        div.removeChild(updatedTextNode);
        div.removeChild(relTime);

        // div의 기존 내용은 그대로 유지하면서, 맨 뒤에 재삽입(원래 "Updated" 부분은 마지막에 있었으므로)
        // 순서를 relative-time 요소 → "Updated" 텍스트로 변경합니다.
        div.appendChild(relTime);
        // 기존 텍스트의 앞뒤 공백을 trim한 후 앞에 한 칸 띄워서 추가합니다.
        div.appendChild(
          document.createTextNode(" " + updatedTextNode.textContent.trim())
        );
      });
    }

    // DOM이 완전히 로드된 후에 실행
    function init() {
      reorderUpdatedRelativeTime();

      // MutationObserver를 사용해 DOM에 변경이 있을 때마다 재실행합니다.
      const observer = new MutationObserver(() => {
        reorderUpdatedRelativeTime();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

  (function () {
    /**
     * div.f6.color-fg-muted.mt-2 내부의 relative-time 요소와 그 인접 텍스트에서
     * "on " 접두사를 제거합니다.
     */
    function removeOnPrefix() {
      // 대상 영역 내의 모든 <relative-time> 요소를 선택합니다.
      const relativeTimes = document.querySelectorAll(
        "div.f6.color-fg-muted.mt-2 relative-time"
      );

      relativeTimes.forEach((rt) => {
        // 1. <relative-time> 요소의 텍스트 자체가 "on "으로 시작하는 경우 제거
        let rtText = rt.textContent.trim();
        if (rtText.startsWith("on ")) {
          rt.textContent = rtText.replace(/^on\s+/, "");
        }

        // 2. <relative-time> 요소의 바로 앞에 위치한 텍스트 노드에 "on"이 포함되어 있다면 제거
        const prev = rt.previousSibling;
        if (prev && prev.nodeType === Node.TEXT_NODE) {
          // 예: 텍스트 노드의 내용이 "on " 또는 "on"으로 끝난다면 이를 제거합니다.
          prev.textContent = prev.textContent.replace(/\bon\s*$/, "");
        }
      });
    }

    // DOM이 로드된 후 및 변경될 때마다 removeOnPrefix()를 실행합니다.
    function init() {
      removeOnPrefix();

      const observer = new MutationObserver(() => {
        removeOnPrefix();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();

  /*────────────────────────────────────────────
    2. GM_* 폴리필 및 페이지 번역 관련 기능
       (Turbo 이벤트 및 MutationObserver 중복 등록 제거)
  ────────────────────────────────────────────*/
  (function (window, document) {
    "use strict";

    // GM_* 함수 폴리필
    function GM_getValue(key, defaultValue) {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    function GM_setValue(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    function GM_notification(message) {
      if (Notification.permission === "granted") {
        new Notification(message);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") new Notification(message);
        });
      }
      console.log("Notification: " + message);
    }

    function GM_xmlhttpRequest(options) {
      const method = options.method || "GET";
      let url = options.url;
      if (method === "GET" && options.params) {
        const query = new URLSearchParams(options.params).toString();
        url += "?" + query;
      }
      fetch(url, {
        method,
        headers: options.headers,
        body: method === "POST" ? options.data : undefined,
      })
        .then((response) =>
          response.text().then((text) => {
            options.onload({ responseText: text });
          })
        )
        .catch((error) => {
          options.onerror({ type: error.name });
        });
    }

    const FeatureSet = {
      enable_RegExp: true,
    };

    const CONFIG = {
      LANG: "ko-KP",
      PAGE_MAP: {
        "gist.github.com": "gist",
        "www.githubstatus.com": "status",
        "skills.github.com": "skills",
        "education.github.com": "education",
      },
      SPECIAL_SITES: ["gist", "status", "skills", "education"],
      OBSERVER_CONFIG: {
        childList: true,
        subtree: true,
        characterData: true,
        attributeFilter: ["value", "placeholder", "aria-label", "data-confirm"],
      },
    };

    let pageConfig = {};

    // 페이지 설정 업데이트
    function updatePageConfig() {
      const newType = detectPageType();
      if (newType && newType !== pageConfig.currentPageType) {
        pageConfig = buildPageConfig(newType);
      }
    }

    function buildPageConfig(pageType = pageConfig.currentPageType) {
      return {
        currentPageType: pageType,
        firstChangeURL: false,
        staticDict: {
          ...I18N[CONFIG.LANG].public.static,
          ...(I18N[CONFIG.LANG][pageType]?.static || {}),
        },
        regexpRules: [
          ...I18N[CONFIG.LANG].public.regexp,
          ...(I18N[CONFIG.LANG][pageType]?.regexp || []),
        ],
        ignoreMutationSelectors: [
          ...I18N.conf.ignoreMutationSelectorPage["*"],
          ...(I18N.conf.ignoreMutationSelectorPage[pageType] || []),
        ].join(", "),
        ignoreSelectors: [
          ...I18N.conf.ignoreSelectorPage["*"],
          ...(I18N.conf.ignoreSelectorPage[pageType] || []),
        ].join(", "),
        characterData: I18N.conf.characterDataPage.includes(pageType),
        tranSelectors: [
          ...(I18N[CONFIG.LANG].public.selector || []),
          ...(I18N[CONFIG.LANG][pageType]?.selector || []),
        ],
      };
    }

    function watchUpdate() {
      let previousURL = window.location.href;
      const handleUrlChange = () => {
        const currentURL = window.location.href;
        if (currentURL !== previousURL) {
          previousURL = currentURL;
          updatePageConfig();
          console.log(
            `【Debug】페이지 전환 pageType= ${pageConfig.currentPageType}`
          );
          pageConfig.firstChangeURL = false;
        }
      };

      const processMutations = (mutations) => {
        mutations
          .flatMap(({ addedNodes, type, target }) => {
            if (type === "childList" && addedNodes.length > 0) {
              return [...addedNodes];
            }
            return type === "attributes" ||
              (type === "characterData" && pageConfig.characterData)
              ? [target]
              : [];
          })
          .filter(
            (node) =>
              !node.parentElement?.closest(pageConfig.ignoreMutationSelectors)
          )
          .forEach((node) => traverseNode(node));
      };

      new MutationObserver((mutations) => {
        if (pageConfig.firstChangeURL) handleUrlChange();
        if (pageConfig.currentPageType) processMutations(mutations);
      }).observe(document.body, CONFIG.OBSERVER_CONFIG);
    }

    function traverseNode(rootNode) {
      const start = performance.now();
      const handleTextNode = (node) => {
        if (node.length > 500) return;
        transElement(node, "data");
      };

      if (rootNode.nodeType === Node.TEXT_NODE) {
        handleTextNode(rootNode);
        return;
      }

      const treeWalker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) =>
            node.matches?.(pageConfig.ignoreSelectors)
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT,
        }
      );

      const handleElement = (node) => {
        switch (node.tagName) {
          case "INPUT":
          case "TEXTAREA":
            if (["button", "submit", "reset"].includes(node.type)) {
              transElement(node.dataset, "confirm");
              transElement(node, "value");
            } else {
              transElement(node, "placeholder");
            }
            break;
          case "OPTGROUP":
            transElement(node, "label");
            break;
          case "BUTTON":
            transElement(node, "title");
            transElement(node.dataset, "confirm");
            transElement(node.dataset, "confirmText");
            transElement(node.dataset, "confirmCancelText");
            transElement(node, "cancelConfirmText");
            transElement(node.dataset, "disableWith");
          // fallthrough
          case "A":
          case "SPAN":
            transElement(node, "title");
            break;
          default:
            if (/tooltipped/.test(node.className))
              transElement(node, "ariaLabel");
        }
      };

      const handlers = {
        [Node.ELEMENT_NODE]: handleElement,
        [Node.TEXT_NODE]: handleTextNode,
      };

      let currentNode;
      while ((currentNode = treeWalker.nextNode())) {
        handlers[currentNode.nodeType]?.(currentNode);
      }

      const duration = performance.now() - start;
      if (duration > 10) {
        console.log(`노드 탐색 소요시간: ${duration.toFixed(2)}ms`);
      }
    }

    function detectPageType() {
      const { PAGE_MAP, SPECIAL_SITES } = CONFIG;
      const url = new URL(window.location.href);
      const { hostname, pathname } = url;
      const site = PAGE_MAP[hostname] || "github";
      const isLogin = document.body.classList.contains("logged-in");
      const metaLocation =
        document.head.querySelector('meta[name="analytics-location"]')
          ?.content || "";
      const isSession = document.body.classList.contains(
        "session-authentication"
      );
      const isHomepage = pathname === "/" && site === "github";
      const isProfile =
        document.body.classList.contains("page-profile") ||
        metaLocation === "/<user-name>";
      const isRepository = /\/<user-name>\/<repo-name>/.test(metaLocation);
      const isOrganization =
        /\/<org-login>/.test(metaLocation) ||
        /^\/(?:orgs|organizations)/.test(pathname);
      const { rePagePathRepo, rePagePathOrg, rePagePath } = I18N.conf;
      let pageType;
      switch (true) {
        case isSession:
          pageType = "session-authentication";
          break;
        case SPECIAL_SITES.includes(site):
          pageType = site;
          break;
        case isProfile:
          const tabParam = new URLSearchParams(url.search).get("tab");
          pageType = pathname.includes("/stars")
            ? "page-profile/stars"
            : tabParam
            ? `page-profile/${tabParam}`
            : "page-profile";
          break;
        case isHomepage:
          pageType = isLogin ? "dashboard" : "homepage";
          break;
        case isRepository:
          const repoMatch = pathname.match(rePagePathRepo);
          pageType = repoMatch ? `repository/${repoMatch[1]}` : "repository";
          break;
        case isOrganization:
          const orgMatch = pathname.match(rePagePathOrg);
          pageType = orgMatch
            ? `orgs/${orgMatch[1] || orgMatch.slice(-1)[0]}`
            : "orgs";
          break;
        default:
          const pathMatch = pathname.match(rePagePath);
          pageType = pathMatch ? pathMatch[1] || pathMatch.slice(-1)[0] : false;
      }
      console.log(
        `【Debug】pathname = ${pathname}, site = ${site}, isLogin = ${isLogin}, analyticsLocation = ${metaLocation}, isOrganization = ${isOrganization}, isRepository = ${isRepository}, isProfile = ${isProfile}, isSession = ${isSession}`
      );
      if (pageType === false || !I18N[CONFIG.LANG]?.[pageType]) {
        console.warn(`[i18n] 페이지 유형 미일치 또는 사전 누락: ${pageType}`);
        return false;
      }
      return pageType;
    }

    function transTitle() {
      const text = document.title;
      let translatedText = I18N[CONFIG.LANG]["title"]["static"][text] || "";
      if (!translatedText) {
        const res = I18N[CONFIG.LANG]["title"].regexp || [];
        for (const [pattern, replacement] of res) {
          translatedText = text.replace(pattern, replacement);
          if (translatedText !== text) break;
        }
      }
      document.title = translatedText;
    }

    function transTimeElement(el) {
      const text =
        el.childNodes.length > 0 ? el.lastChild.textContent : el.textContent;
      const translatedText = text.replace(/^on/, "");
      if (translatedText !== text) {
        el.textContent = translatedText;
      }
    }

    function watchTimeElement(el) {
      new MutationObserver((mutations) => {
        transTimeElement(mutations[0].addedNodes[0]);
      }).observe(el, { childList: true });
    }

    function transElement(el, field) {
      const text = el[field];
      if (!text) return false;
      const translatedText = transText(text);
      if (translatedText) {
        el[field] = translatedText;
      }
    }

    function transText(text) {
      const shouldSkip = (text) =>
        /^[\s0-9]*$/.test(text) ||
        /^[\u4e00-\u9fa5]+$/.test(text) ||
        !/[a-zA-Z,.]/.test(text);
      if (shouldSkip(text)) return false;
      const trimmedText = text.trim();
      const cleanedText = trimmedText.replace(/\xa0|[\s]+/g, " ");
      const translatedText = fetchTranslatedText(cleanedText);
      if (translatedText && translatedText !== cleanedText) {
        return text.replace(trimmedText, translatedText);
      }
      return false;
    }

    function fetchTranslatedText(text) {
      let translatedText = pageConfig.staticDict[text];
      if (typeof translatedText === "string") return translatedText;
      if (FeatureSet.enable_RegExp) {
        for (const [pattern, replacement] of pageConfig.regexpRules) {
          translatedText = text.replace(pattern, replacement);
          if (translatedText !== text) return translatedText;
        }
      }
      return false;
    }

    function getNestedProperty(obj, path) {
      return path.split(".").reduce((acc, part) => {
        const match = part.match(/(\w+)(?:\[(\d+)\])?/);
        if (!match) return undefined;
        const key = match[1];
        const index = match[2];
        if (acc && acc[key] !== undefined) {
          return index !== undefined ? acc[key][index] : acc[key];
        }
        return undefined;
      }, obj);
    }

    function transBySelector() {
      pageConfig.tranSelectors?.forEach(([selector, translatedText]) => {
        const element = document.querySelector(selector);
        if (element) {
          element.textContent = translatedText;
        }
      });
    }

    // 초기화: 페이지 설정 업데이트, DOM 전체 번역, URL 변화 감시
    function init() {
      updatePageConfig();
      console.log(`【Debug】시작 pageType= ${pageConfig.currentPageType}`);
      if (pageConfig.currentPageType) traverseNode(document.body);
      watchUpdate();
    }

    // 페이지 lang 강제 설정 (ko-KP)
    document.documentElement.lang = CONFIG.LANG;
    new MutationObserver(() => {
      if (document.documentElement.lang === "en") {
        document.documentElement.lang = CONFIG.LANG;
      }
    }).observe(document.documentElement, { attributeFilter: ["lang"] });

    // Turbo 이벤트 처리 (페이지 전환 시 재번역)
    document.addEventListener("turbo:before-fetch-response", () => {
      pageConfig.firstChangeURL = true;
    });
    document.addEventListener("DOMContentLoaded", init);
    document.addEventListener("turbo:load", () => {
      updatePageConfig();
      console.log(
        `【Debug】Turbo load - 재적용 pageType= ${pageConfig.currentPageType}`
      );
      traverseNode(document.body);
      transTitle();
      transBySelector();
    });
  })(window, document);
})();
