import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		// Polyfill process.env for the @google/genai SDK in browser
		'process.env': process.env
	}
});