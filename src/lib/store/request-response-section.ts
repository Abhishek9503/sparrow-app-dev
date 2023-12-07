import { writable } from "svelte/store";
import type {
  NewTab,
  CurrentTab,
} from "$lib/utils/interfaces/request.interface";

//this store is for collaps and expand section
export const collapsibleState = writable(false);

//this is for horizaontal and vertical mode
export const isHorizontalVertical = writable(false);

//store for Api Request ------>here i will store all new request
const initialRequest = [
  {
    url: "",
    method: "",
    body: "",
    headers: "",
    request: "",
  },
];
export const apiRequest = writable(initialRequest);

export const currentTab = writable<CurrentTab>({ id: null });
export const tabs = writable<NewTab[]>([]);
export const progressiveTab = writable({});

/**
 * Creates a new tab and adds it to the tab bar.
 */
const createTab = async (tab: NewTab): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.isActive = false;
      }
      return elem;
    });
    return [...updatedTab, tab];
  });
  progressiveTab.set(tab);
};
/**
 * Removes an existing tab from the tab bar.
 */

const removeTab = async (id: string): Promise<void> => {
  tabs.update((doc: NewTab[]): NewTab[] => {
    for (let i = 0; i < doc.length; i++) {
      if (doc[i].id === id) {
        if (doc[i + 1]) {
          activeTab(doc[i + 1].id);
        } else if (doc[i - 1]) {
          activeTab(doc[i - 1].id);
        }
      }
    }
    const filteredTabs = doc.filter((elem) => {
      if (elem.id === id) return false;
      else return true;
    });
    return [...filteredTabs];
  });
};

/**
 * Activates an existing tab in the tab bar.
 */

const activeTab = async (id: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.isActive = false;
      }
      return elem;
    });
    return [...updatedTab];
  });
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.id === id) {
        elem.isActive = true;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};

/**
 * Extracts all data of the active tab.
 */
const getTab = () => {
  return progressiveTab;
};

/**
 * Return all the RxDocument observable refers to this collection in ascending order with respect to createdAt.
 */
const getTabList = () => {
  return tabs;
};
/**
 * Configures the request with properties such as URL, method, body, query parameters, headers, authentication, and response handling.
 */
const setRequestProperty = async (data, route: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.property.request[route] = data;
        elem.save = false;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};

/**
 * Configures the request with state such as raw, dataset, auth, section.
 */
const setRequestState = async (data, route: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.property.request.state[route] = data;
        elem.save = false;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};
/**
 * Configures the request with Auth such as API key, bearer token, basic auth.
 */
const setRequestAuth = async (data, route: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.property.request.auth[route] = data;
        elem.save = false;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};
/**
 * Configures the request body such as form data, url encoded, raw.
 */
const setRequestBody = async (data, route: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.property.request.body[route] = data;
        elem.save = false;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};
/**
 * Configures the request body form data such as text and file.
 */
const setRequestBodyFormData = async (data, route: string): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.isActive) {
        elem.property.request.body.formdata[route] = data;
        elem.save = false;
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};

/**
 * Responsible to change tab property like :
 * id, name, description, save.
 */
const setTabProperty = async (
  data,
  route: string,
  _id: string,
): Promise<void> => {
  tabs.update((value: NewTab[]): NewTab[] => {
    const updatedTab = value.map((elem: NewTab): NewTab => {
      if (elem.id === _id) {
        elem[route] = data;
        if (route !== "save") {
          elem.save = false;
        }
        progressiveTab.set(elem);
      }
      return elem;
    });
    return [...updatedTab];
  });
};

/**
 * Clear tabs
 */
const clearTabs = async () => {
  tabs.set([]);
  progressiveTab.set({});
};

export const syncTabs = (data, tab) => {
  tabs.set(data);
  progressiveTab.set(tab);
};

const requestResponseStore = {
  clearTabs,
  setTabProperty,
  setRequestBodyFormData,
  setRequestBody,
  setRequestAuth,
  setRequestState,
  setRequestProperty,
  getTabList,
  getTab,
  activeTab,
  removeTab,
  createTab,
};
export { requestResponseStore };
