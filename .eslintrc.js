module.exports = {
  extends: 'standard-with-typescript',
  env: {
    'cypress/globals': true
  },
  parserOptions: {
    project: './tsconfig.eslint.json'
  },
  plugins: [
    'cypress'
  ],
  globals: {
    StroeerVideoplayer: 'readonly'
  }
}
