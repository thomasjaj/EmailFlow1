# Contributing to EmailPro

Thank you for your interest in contributing to EmailPro! This guide will help you get started with contributing to the project.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** - Search through existing issues to see if the bug has already been reported
2. **Create a detailed bug report** - Include:
   - Clear description of the issue
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

1. **Check existing feature requests** - Look through existing issues labeled "enhancement"
2. **Create a detailed feature request** - Include:
   - Clear description of the proposed feature
   - Use cases and benefits
   - Possible implementation approach
   - Any relevant mockups or examples

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/emailpro.git
   cd emailpro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Set up database**
   ```bash
   # Start PostgreSQL service
   sudo systemctl start postgresql
   
   # Create development database
   sudo -u postgres createdb emailpro_dev
   
   # Run migrations
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

## Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Use Prettier for consistent formatting
- **Linting**: Follow ESLint rules
- **Naming**: Use descriptive variable and function names

### Architecture

- **Frontend**: React components with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: Use Drizzle ORM for database operations
- **API**: RESTful API design patterns

### Testing

- Write unit tests for new functions
- Add integration tests for API endpoints
- Test UI components with user interactions
- Ensure all tests pass before submitting PR

### Documentation

- Update README.md if needed
- Add JSDoc comments for functions
- Update API documentation for new endpoints
- Include inline comments for complex logic

## Project Structure

```
emailpro/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
├── server/                # Backend Express app
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── middleware/        # Express middleware
├── shared/                # Shared code
│   └── schema.ts          # Database schemas
├── docs/                  # Documentation
└── tests/                 # Test files
```

## PowerMTA Integration

When working on PowerMTA features:

1. **Test with mock data** - Use mock PowerMTA responses for development
2. **Documentation** - Update PowerMTA integration guide
3. **Error handling** - Implement proper error handling for PowerMTA failures
4. **Logging** - Add comprehensive logging for debugging

## Database Changes

For database schema changes:

1. **Create migrations** - Use Drizzle schema migrations
2. **Update types** - Update TypeScript types in `shared/schema.ts`
3. **Test migrations** - Ensure migrations work both up and down
4. **Backup compatibility** - Consider backward compatibility

## Security Considerations

- **Input validation** - Validate all user inputs
- **Authentication** - Ensure proper authentication checks
- **SQL injection** - Use parameterized queries
- **XSS prevention** - Sanitize user-generated content
- **Rate limiting** - Implement appropriate rate limits

## Performance Guidelines

- **Database queries** - Optimize database queries
- **API responses** - Keep API responses lightweight
- **Frontend performance** - Optimize React components
- **Memory usage** - Monitor memory usage in long-running processes

## Getting Help

If you need help:

1. **Check documentation** - Review existing docs and guides
2. **Search issues** - Look for similar questions in issues
3. **Join discussions** - Participate in GitHub Discussions
4. **Ask questions** - Create an issue with the "question" label

## Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to EmailPro!