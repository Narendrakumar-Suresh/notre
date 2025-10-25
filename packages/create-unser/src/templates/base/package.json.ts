export const getPackageJson = (projectName: string, tailwind: boolean) => {
  const devDependencies: Record<string, string> = {
    "@types/node": "^24.9.1",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    typescript: "^5.7.2",
  };

  if (tailwind) {
    devDependencies["@tailwindcss/vite"] = "^4.1.16";
    devDependencies["tailwindcss"] = "^4.1.16";
  }

  return JSON.stringify(
    {
      name: projectName,
      type: "module",
      scripts: {
        dev: "vinxi dev --host localhost",
        build: "vinxi build",
        start: "vinxi start",
      },
      dependencies: {
        react: "^19.0.2",
        "react-dom": "^19.0.2",
        notre: "^0.1.0",
        vinxi: "^0.5.8",
      },
      devDependencies,
    },
    null,
    2,
  );
};
