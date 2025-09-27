# Claude Development Notes

## Pre-completion Checklist

Before considering any coding task complete, ALWAYS run:

1. **Tests**: `npm test` - Ensure all tests pass
2. **Linter**: `npm run lint` - Ensure code quality standards are met
3. **Type Check**: `npm run typecheck` (if available) - Ensure TypeScript compilation

### Why this matters:
- CI pipelines will fail if linting errors exist
- Code quality issues can cause deployment problems
- Tests verify functionality works as expected
- Type checking prevents runtime errors

### Remember:
- Fix ALL linting errors before marking tasks complete
- Run both commands even if tests pass - linting is separate
- Don't assume passing tests means the code is ready for CI

This applies to ALL coding tasks, not just testing-related work.

## Lessons Learned

### Prisma Import Paths (Dec 2024)
**Problem**: Test imports failing with `Cannot find module '../../generated/prisma'`
**Root Cause**: Custom Prisma output directory in schema.prisma causes non-standard import paths
**Solution**: Always match test imports to the actual application imports
- Check how main app imports Prisma (e.g., `src/server.ts`)
- Use the same import path in tests (e.g., `../../generated/prisma` not `@prisma/client`)
- Run `npx prisma generate` if imports still fail

**Key Learning**: Don't assume standard import paths - always verify what the actual app uses

### ESLint Unused Variables
**Problem**: CI failing on unused variables even when tests pass
**Root Cause**: Declaring variables in tests but not using them (e.g., `const response = await...`)
**Solution**: Either use the variable or remove the assignment
- Use: `expect(response.body).toHaveProperty('error')`
- Or remove: `await request(app)...` (no const assignment)

**Key Learning**: ESLint checks are separate from test functionality - both must pass

### Database Setup for Testing
**Problem**: Prisma safety mechanisms preventing database operations
**Root Cause**: Prisma protecting against dangerous operations by AI agents
**Solution**: Get explicit user consent and use environment variable
- Ask user for consent with clear explanation of risks
- Use `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes"` environment variable
- Only for development/test databases, never production

**Key Learning**: Always explain database operations and get explicit user consent