import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768; // largeur en pixels

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(
    Dimensions.get("window").width < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };

    const subscription = Dimensions.addEventListener("change", onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return isMobile;
}
