import React, { useEffect } from "react";
import { initializeDynamicFavicon } from "../../utils/favicon";

/**
 * Component that handles the dynamic favicon updates based on color scheme
 * This component doesn't render anything visible in the UI
 */
const DynamicFavicon: React.FC = () => {
  useEffect(() => {
    // Initialize the dynamic favicon and get the cleanup function
    const cleanup = initializeDynamicFavicon();

    // Return the cleanup function to remove event listeners when component unmounts
    return cleanup;
  }, []);

  // This component doesn't render anything in the DOM
  return null;
};

export default DynamicFavicon;
