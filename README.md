# Bring Buffer

A TypeScript-first library project template.

## Features

- 🚀 TypeScript-first with full type safety
- 📦 Modern ES modules support
- 🧪 Comprehensive test suite with Jest
- 🔧 Hot reload development with nodemon
- 📚 Full JSDoc documentation support
- 🎯 Zero dependencies

## Development

### Prerequisites

- Node.js 16+
- npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd bring-buffer

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Start development mode with hot reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
bring-buffer/
├── src/
│   └── index.ts          # Main library entry point
├── dist/                 # Built files (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
└── README.md            # This file
```

## Getting Started

1. Start by implementing your library functionality in `src/index.ts`
2. Add tests in `src/` with `.test.ts` or `.spec.ts` extensions
3. Update the package.json with your library details
4. Customize the README with your library's documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 