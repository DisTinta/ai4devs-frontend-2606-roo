import router from './candidateRoutes';

// The /stage route reuses the existing controller; there is no supertest harness
// in this project, so we assert the router registers the expected method+path
// layers. This proves the additive binding without a live server.
const layerFor = (path: string, method: string) =>
  router.stack.find(
    (layer: any) =>
      layer.route?.path === path && layer.route?.methods?.[method],
  );

describe('candidateRoutes', () => {
  it('registers PUT /:id/stage (additive stage-change route)', () => {
    expect(layerFor('/:id/stage', 'put')).toBeDefined();
  });

  it('keeps the existing PUT /:id route (non-breaking)', () => {
    expect(layerFor('/:id', 'put')).toBeDefined();
  });
});
