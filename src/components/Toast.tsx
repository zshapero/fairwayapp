import {
  type JSX,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MASTERS_GREEN } from '@/theme/colors';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => undefined,
});

interface ToastProviderProps {
  children: ReactNode;
}

interface ActiveToast {
  id: number;
  message: string;
}

let nextId = 0;

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [active, setActive] = useState<ActiveToast | null>(null);

  const show = useCallback((message: string) => {
    const id = ++nextId;
    setActive({ id, message });
    // Auto-dismiss after 2s by clearing state.
    setTimeout(() => {
      setActive((cur) => (cur?.id === id ? null : cur));
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {active !== null ? (
        <SafeAreaView
          edges={['top']}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOut.duration(220)}
            style={{
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: '#FAF6EE',
              shadowColor: '#0F172A',
              shadowOpacity: 0.16,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
              borderWidth: 0.5,
              borderColor: 'rgba(11, 107, 58, 0.15)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 13,
                color: MASTERS_GREEN,
              }}
            >
              {active.message}
            </Text>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

