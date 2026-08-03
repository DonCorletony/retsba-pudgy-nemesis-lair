import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

/* Self-contained on purpose: the art and audio live in this project's own
   public/ folder rather than being read from the parent repo, so the build
   needs no "include files outside the root directory" setting on the host. */
export default defineConfig({
  plugins: [react()],
});
