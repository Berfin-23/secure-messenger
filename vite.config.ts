import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or whichever framework you're using

export default defineConfig({
  plugins: [react()],
  envDir: "./env", // specify the directory containing your .env file
});
