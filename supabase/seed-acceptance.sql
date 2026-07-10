-- Idempotent seed for TEST_PLAN.md location acceptance scenarios.
-- Fixture coordinates: src/__tests__/fixtures/places.ts

DO $$
DECLARE
  test_user_id uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  test_guide_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      test_user_id,
      'authenticated',
      'authenticated',
      'acceptance-test@waypoint.local',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.users (id, handle, display_name)
  VALUES (test_user_id, 'acceptance_test', 'Acceptance Test')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.guides (id, user_id, title, is_public, slug)
  VALUES (
    test_guide_id,
    test_user_id,
    'Acceptance Test Guide',
    true,
    'acceptance-test-guide'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    title = EXCLUDED.title,
    is_public = EXCLUDED.is_public,
    slug = EXCLUDED.slug;

  INSERT INTO public.places (
    id,
    guide_id,
    name,
    address,
    rating,
    category,
    sort_order,
    location
  )
  VALUES
    (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      test_guide_id,
      'Place A',
      '123 Main St',
      4,
      'cafe',
      0,
      ST_SetSRID(ST_MakePoint(-73.98, 40.75), 4326)::extensions.geography
    ),
    (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      test_guide_id,
      'Place B',
      '456 Oak Ave',
      5,
      'restaurant',
      1,
      ST_SetSRID(ST_MakePoint(-118.25, 34.05), 4326)::extensions.geography
    )
  ON CONFLICT (id) DO UPDATE SET
    guide_id = EXCLUDED.guide_id,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    rating = EXCLUDED.rating,
    category = EXCLUDED.category,
    sort_order = EXCLUDED.sort_order,
    location = EXCLUDED.location;
END $$;
