module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/index.html",
    "../src/**/*.{js,jsx,ts,tsx}", // Ajoute ceci
    "../src/index.html", // Ajoute ceci
    "./public/**/*.{js,jsx,ts,tsx}",
    "./src/types/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "cryptos-dark": "#030121",
        "cryptos-yellow": "#FFDE59",
        "cryptos-black": "#000000",
      },
    },
  },
  plugins: [],
};
