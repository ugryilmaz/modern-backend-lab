export default {
  '*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}': ['eslint --fix', 'prettier --write'],

  '*.{json,md,yml,yaml}': ['prettier --write'],
};
