import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import useEventCallback from "./use-event-callback";
import useEventListener from "./use-event-listener";

declare global {
  interface WindowEventMap {
    "local-storage": CustomEvent;
  }
}

type SetValue<T> = Dispatch<SetStateAction<T>>;

const parseJSON = <T>(value: string | null): T | undefined => {
  try {
    return value === "undefined" ? undefined : JSON.parse(value ?? "");
  } catch {
    console.warn("Unable to parse value:", value);
    return undefined;
  }
};

interface UseLocalStorageOptions<T> {
  raw?: boolean;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): [T, SetValue<T>] => {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (options?.raw) {
        return item as unknown as T;
      }

      if (options?.deserializer) {
        return item ? options.deserializer(item) : initialValue;
      }

      return item ? (parseJSON(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Unable to get value for key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key, options]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: SetValue<T> = useEventCallback(value => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;

      if (options?.raw) {
        window.localStorage.setItem(key, newValue as unknown as string);
      } else if (options?.serializer) {
        window.localStorage.setItem(key, options.serializer(newValue));
      } else {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }

      setStoredValue(newValue);

      window.dispatchEvent(new Event("local-storage"));
    } catch (error) {
      console.warn(`Unable to store value for key "${key}":`, error);
    }
  });

  useEffect(() => {
    setStoredValue(readValue());
  }, []);

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent)?.key && (event as StorageEvent).key !== key) {
        return;
      }
      setStoredValue(readValue());
    },
    [key, readValue],
  );

  useEventListener("storage", handleStorageChange);

  useEventListener("local-storage", handleStorageChange);

  return [storedValue, setValue];
};

export default useLocalStorage;
