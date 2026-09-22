import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TAB_ROOTS = ['/', '/characters', '/stories', '/settings'];
const ROOT_SET = new Set(TAB_ROOTS);

const rootOf = (path) => (ROOT_SET.has(path) ? path : null);

// Safe default so consumers never destructure null (e.g. during HMR before the
// provider re-mounts). The provider's value always overrides this.
const TabStackContext = createContext({
  activeTab: '/',
  switchToTab: () => {},
  saveScroll: () => {},
  getScroll: () => 0,
});

const initialStacks = () =>
  TAB_ROOTS.reduce((acc, r) => {
    acc[r] = [r];
    return acc;
  }, {});

export function TabStackProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [stacks, setStacks] = useState(initialStacks);
  const [activeTab, setActiveTab] = useState(() => rootOf(location.pathname) || '/');

  const activeTabRef = useRef(activeTab);
  const stacksRef = useRef(stacks);
  const scrollPositions = useRef({});
  activeTabRef.current = activeTab;
  stacksRef.current = stacks;

  // Maintain per-tab location stacks as the user navigates.
  useEffect(() => {
    const path = location.pathname;
    const root = rootOf(path);
    if (root) {
      // Landing on a tab root: activate it and reset that tab's stack to [root].
      setActiveTab(root);
      activeTabRef.current = root;
      setStacks((prev) => ({ ...prev, [root]: [root] }));
    } else {
      // Child screen: push onto the active tab's stack, or pop if returning to an existing entry.
      const tab = activeTabRef.current;
      setStacks((prev) => {
        const stack = prev[tab] || [tab];
        if (stack[stack.length - 1] === path) return prev;
        const idx = stack.indexOf(path);
        if (idx >= 0) {
          return { ...prev, [tab]: stack.slice(0, idx + 1) };
        }
        return { ...prev, [tab]: [...stack, path] };
      });
    }
  }, [location.pathname]);

  const switchToTab = useCallback(
    (root) => {
      if (root === activeTabRef.current) {
        // Re-selecting the active tab resets it to its root screen.
        setStacks((prev) => ({ ...prev, [root]: [root] }));
        if (location.pathname !== root) navigate(root);
      } else {
        // Switching tabs: restore the saved top of that tab's stack.
        const stack = stacksRef.current[root] || [root];
        const top = stack[stack.length - 1];
        activeTabRef.current = root;
        navigate(top);
      }
    },
    [navigate, location.pathname]
  );

  const saveScroll = useCallback((path, scrollTop) => {
    scrollPositions.current[path] = scrollTop;
  }, []);

  const getScroll = useCallback((path) => scrollPositions.current[path] || 0, []);

  return (
    <TabStackContext.Provider value={{ activeTab, switchToTab, saveScroll, getScroll }}>
      {children}
    </TabStackContext.Provider>
  );
}

export const useTabStack = () => useContext(TabStackContext);