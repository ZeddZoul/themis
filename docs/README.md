# Themis Checker Documentation

This directory contains comprehensive documentation for the Themis Checker application, including setup guides, testing procedures, and validation scripts.

## Setup Documentation

### [github-app-setup.md](./github-app-setup.md)
Complete guide for configuring the GitHub App with proper permissions:
- Creating a new GitHub App
- Updating existing app permissions
- Required permissions (Contents: Read, Metadata: Read)
- Installation instructions
- Troubleshooting common issues
- Security best practices

### [github-app-manifest.json](./github-app-manifest.json)
Template manifest file for quick GitHub App creation with correct permissions.

## Testing and Validation Documentation

This section covers testing and validating the UI optimization enhancements implemented in the Themis Checker application.

## Quick Start

Run all validation scripts at once:

```bash
npm run validate
```

Or run individual validation scripts:

```bash
npm run validate:query      # TanStack Query integration
npm run validate:ui         # UI components
npm run validate:performance # Performance optimizations
npm run validate:a11y       # Accessibility features
```

## Documentation Files

### [testing-validation.md](./testing-validation.md)
Comprehensive manual testing guide covering:
- TanStack Query integration testing
- UI component testing
- Performance testing
- Accessibility testing

### Performance Documentation

- [bundle-analysis.md](./bundle-analysis.md) - Bundle size analysis and optimization
- [caching-strategy.md](./caching-strategy.md) - Data caching with TanStack Query
- [performance-monitoring.md](./performance-monitoring.md) - Performance tracking setup
- [server-side-optimizations.md](./server-side-optimizations.md) - SSR and SSG strategies

## Validation Scripts

All validation scripts are located in the `scripts/` directory:

### 1. TanStack Query Integration (`validate-tanstack-query.js`)
Validates:
- Package installation
- QueryClient configuration
- Query keys structure
- Custom hooks implementation
- Provider setup
- Stale time configuration
- Error handling
- Polling functionality

### 2. UI Components (`validate-ui-components.js`)
Validates:
- PlatformSelector component
- StatsCard component
- Sidebar component
- Icon system
- Tooltip component

### 3. Performance Optimizations (`validate-performance.js`)
Validates:
- Bundle analyzer configuration
- Next.js optimizations
- Component memoization
- Hook memoization (useCallback, useMemo)
- Dynamic imports (code splitting)
- Performance monitoring
- Image optimization
- Bundle size validation

### 4. Accessibility Features (`validate-accessibility.js`)
Validates:
- Keyboard navigation
- ARIA labels and roles
- Color contrast ratios
- Semantic HTML usage
- Touch target sizes

## Testing Workflow

### 1. Automated Validation

Run automated validation scripts to check code implementation:

```bash
# Run all validations
npm run validate

# Or run specific validations
npm run validate:query
npm run validate:ui
npm run validate:performance
npm run validate:a11y
```

### 2. Manual Testing

Follow the detailed manual testing procedures in [testing-validation.md](./testing-validation.md):

- Test TanStack Query caching and revalidation
- Test UI component interactions
- Measure performance metrics
- Test accessibility with keyboard and screen readers

### 3. Production Build Testing

Build and analyze the production bundle:

```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run analyze

# Check bundle size limits
npm run check-bundle-size
```

### 4. Performance Auditing

Run Lighthouse audits:

```bash
# Install Lighthouse globally (if not already installed)
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/dashboard --view
```

## Performance Targets

### Bundle Size Limits
- Initial JavaScript bundle: < 100KB (gzipped)
- Individual page bundles: < 50KB (gzipped)
- Total client-side JavaScript: < 400KB (gzipped)

### Core Web Vitals
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

## Accessibility Standards

All components must meet WCAG 2.1 AA compliance:

- ✅ Keyboard accessible
- ✅ Screen reader compatible
- ✅ Color contrast ratios meet 4.5:1 (text) and 3:1 (UI)
- ✅ Touch targets at least 44x44px
- ✅ Semantic HTML
- ✅ Proper ARIA attributes

## Testing Tools

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation
- **React DevTools** - Component profiling and debugging
- **Lighthouse** - Performance and accessibility audits

### Screen Readers
- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free) or JAWS
- **Linux**: Orca

### Performance Tools
- **Chrome DevTools** - Performance profiling
- **React DevTools Profiler** - Component render tracking
- **Next.js Bundle Analyzer** - Bundle size analysis
- **Lighthouse** - Core Web Vitals measurement

## Continuous Integration

Consider adding these validation scripts to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Validations
  run: npm run validate

- name: Build and Check Bundle Size
  run: |
    npm run build
    npm run check-bundle-size
```

## Troubleshooting

### Validation Script Fails

If a validation script fails:

1. Read the error output carefully
2. Check the specific file mentioned in the error
3. Review the requirements in the design document
4. Fix the issue and re-run the validation

### Performance Issues

If performance targets are not met:

1. Run bundle analyzer: `npm run analyze`
2. Identify large dependencies
3. Check for unnecessary re-renders with React DevTools Profiler
4. Review memoization implementation
5. Consider additional code splitting

### Accessibility Issues

If accessibility checks fail:

1. Test with keyboard navigation
2. Use browser accessibility tools (axe, WAVE)
3. Test with a screen reader
4. Check ARIA attributes in browser DevTools
5. Verify color contrast ratios

## Additional Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Next.js Performance Documentation](https://nextjs.org/docs/advanced-features/measuring-performance)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

## Contributing

When adding new features:

1. Update validation scripts if needed
2. Add manual testing procedures to testing-validation.md
3. Ensure all validations pass before submitting PR
4. Document any new testing requirements

## Support

For questions or issues with testing:

1. Review the testing documentation
2. Check validation script output for specific guidance
3. Consult the design document for requirements
4. Reach out to the development team

---

**Last Updated**: November 2025
**Version**: 1.0.0
