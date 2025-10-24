module.exports = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "^components/(.*)$",
    "^hooks/(.*)$",
    "^prisma/(.*)$",
    "^lib/(.*)$",
    "^types/(.*)$",
    "<THIRD_PARTY_MODULES>",
    "^[./]",
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
