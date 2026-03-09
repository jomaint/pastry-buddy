-- Pastry Buddy Seed Data
-- Source: California bakery research (March 2026)
-- 15 bakeries, ~120 pastries, curated by quality + cultural diversity

-- ============================================================
-- BAKERIES
-- ============================================================

INSERT INTO bakeries (id, name, slug, address, city, country, latitude, longitude, google_place_id) VALUES

-- Los Angeles
('b001', 'Porto''s Bakery & Cafe', 'portos-bakery', '3614 W Magnolia Blvd', 'Burbank, CA', 'US', 34.1808, -118.3090, NULL),
('b002', 'République', 'republique-la', '624 S La Brea Ave', 'Los Angeles, CA', 'US', 34.0632, -118.3444, NULL),
('b003', 'Fondry', 'fondry', '1633 Colorado Blvd', 'Eagle Rock, CA', 'US', 34.1375, -118.2117, NULL),
('b004', 'Modu Cafe', 'modu-cafe', '5043 York Blvd', 'Highland Park, CA', 'US', 34.1112, -118.2019, NULL),
('b005', 'Tu Cha', 'tu-cha', '621 S Western Ave #208', 'Los Angeles, CA', 'US', 34.0620, -118.3089, NULL),
('b006', 'Lou, The French On The Block', 'lou-french', '1604 Sunset Blvd', 'Los Angeles, CA', 'US', 34.0775, -118.2535, NULL),

-- San Francisco / Bay Area
('b007', 'Arsicault Bakery', 'arsicault-bakery', '397 Arguello Blvd', 'San Francisco, CA', 'US', 37.7833, -122.4593, NULL),
('b008', 'B Patisserie', 'b-patisserie', '2821 California St', 'San Francisco, CA', 'US', 37.7878, -122.4402, NULL),
('b009', 'Tartine Bakery', 'tartine-bakery', '600 Guerrero St', 'San Francisco, CA', 'US', 37.7614, -122.4241, NULL),
('b010', 'Butter & Crumble', 'butter-crumble', '346 Columbus Ave', 'San Francisco, CA', 'US', 37.7983, -122.4074, NULL),
('b011', 'Grand Opening', 'grand-opening-sf', '1489 Webster St', 'San Francisco, CA', 'US', 37.7836, -122.4316, NULL),
('b012', 'Third Culture Bakery', 'third-culture', '2222 Fourth St', 'Berkeley, CA', 'US', 37.8716, -122.2975, NULL),
('b013', 'Golden Gate Bakery', 'golden-gate-bakery', '1029 Grant Ave', 'San Francisco, CA', 'US', 37.7963, -122.4077, NULL),

-- Orange County
('b014', 'Cream Pan', 'cream-pan', '602 El Camino Real', 'Tustin, CA', 'US', 33.7463, -117.8264, NULL),
('b015', '61 Hundred Bread', '61-hundred-bread', '220 E 4th St', 'Santa Ana, CA', 'US', 33.7468, -117.8680, NULL);


-- ============================================================
-- PASTRIES
-- ============================================================

INSERT INTO pastries (id, name, slug, bakery_id, category, description) VALUES

-- Porto's Bakery (b001) — Cuban-American institution
('p001', 'Refugiado® (Guava & Cheese Strudel)', 'refugiado-guava-cheese', 'b001', 'Pastries', 'Porto''s signature: flaky puff pastry filled with sweet guava and cream cheese. The thing people stock up on.'),
('p002', 'Cheese Roll®', 'cheese-roll', 'b001', 'Bread', 'Cream cheese-filled puff pastry with caramelized sugar crust. Addictively buttery.'),
('p003', 'Potato Ball® (Papa Rellena)', 'potato-ball', 'b001', 'Empanadas', 'Crispy panko-crusted ball stuffed with seasoned picadillo. Savory perfection.'),
('p004', 'Dulce de Leche Besito® Cookie', 'dulce-de-leche-besito', 'b001', 'Cookies', 'Shortbread cookie sandwiched with dulce de leche cream.'),
('p005', 'Ham & Cheese Croissant', 'portos-ham-cheese-croissant', 'b001', 'Croissants', 'Baked ham and cheese in buttery croissant dough.'),
('p006', 'Milk''N Berries® Cake', 'milk-n-berries-cake', 'b001', 'Cakes', 'Light sponge with fresh berries and whipped cream. Porto''s bestselling cake.'),
('p007', 'Chicken Empanada', 'chicken-empanada', 'b001', 'Empanadas', 'Flaky pastry filled with seasoned shredded chicken.'),
('p008', 'Opera Cake Slice', 'opera-cake', 'b001', 'Cakes', 'Layers of almond sponge, coffee buttercream, and chocolate ganache.'),
('p009', 'Tres Leches Cake', 'tres-leches', 'b001', 'Cakes', 'Sponge soaked in three milks, topped with whipped cream.'),

-- République (b002) — James Beard Award-winning
('p010', 'Kouign-Amann', 'republique-kouign-amann', 'b002', 'Kouign-amann', 'Caramelized Breton pastry. Thick, buttery, crackly crust with tender layers.'),
('p011', 'Miso White Chocolate Almond Croissant', 'miso-almond-croissant', 'b002', 'Croissants', 'Almond croissant elevated with miso and white chocolate. Sweet-savory umami.'),
('p012', 'Bomboloni', 'republique-bomboloni', 'b002', 'Donuts', 'Italian filled doughnuts with pastry cream or seasonal jam. Pillowy and rich.'),
('p013', 'Raspberry Brioche Tart', 'raspberry-brioche-tart', 'b002', 'Tarts', 'Buttery brioche base topped with fresh raspberries and pastry cream.'),
('p014', 'Morning Bun', 'republique-morning-bun', 'b002', 'Croissants', 'Cinnamon sugar laminated pastry with citrus zest. Caramelized edges.'),
('p015', 'Canelés', 'republique-caneles', 'b002', 'Cakes', 'Bordeaux specialty: crispy caramelized shell, soft rum-vanilla custard center.'),
('p016', 'Pain au Chocolat', 'republique-pain-au-chocolat', 'b002', 'Croissants', 'Flaky laminated pastry with Valrhona dark chocolate batons.'),
('p017', 'Handmade Toaster Pie', 'toaster-pie', 'b002', 'Pies', 'Fruit and cream cheese filled hand pie. Rustic and comforting.'),

-- Fondry (b003) — Best kouign-amann in LA
('p018', 'Kouign-Amann', 'fondry-kouign-amann', 'b003', 'Kouign-amann', 'Tender spiraled bun that pulls apart like yarn. Arguably the best in LA.'),
('p019', 'Butter Croissant', 'fondry-butter-croissant', 'b003', 'Croissants', 'Perfectly laminated, deeply caramelized. Serious butter game.'),
('p020', 'Seasonal Laminated Pastry', 'fondry-seasonal', 'b003', 'Croissants', 'Rotating seasonal flavors featuring local California ingredients.'),

-- Modu Cafe (b004) — Korean-influenced boundary-pushing
('p021', 'Black Sesame Chocolate Cookie', 'black-sesame-choc-cookie', 'b004', 'Cookies', 'Spongy, tangy, totally unique. Korean-California fusion at its best.'),
('p022', 'Perilla Leaf Lime Tart', 'perilla-lime-tart', 'b004', 'Tarts', 'Lime tart with perilla leaf. Herbaceous and refreshing.'),
('p023', 'Hojicha Financier', 'hojicha-financier', 'b004', 'Cakes', 'Classic French financier with roasted Japanese green tea. Nutty and smoky.'),
('p024', 'Miso Brown Butter Cookie', 'miso-brown-butter-cookie', 'b004', 'Cookies', 'Brown butter cookie with white miso. Sweet-savory caramelized edges.'),

-- Tu Cha (b005) — Viral fruit-shaped desserts
('p025', 'Mango Fruit Dessert', 'tu-cha-mango', 'b005', 'Cakes', 'Trompe-l''oeil fruit-shaped dessert: chocolate shell, mango mousse, real fruit center.'),
('p026', 'Strawberry Fruit Dessert', 'tu-cha-strawberry', 'b005', 'Cakes', 'Realistic strawberry-shaped dessert with strawberry mousse filling.'),
('p027', 'Peach Fruit Dessert', 'tu-cha-peach', 'b005', 'Cakes', 'Peach-shaped chocolate shell with peach mousse and fresh peach center.'),

-- Lou, The French On The Block (b006)
('p028', 'Almond Croissant', 'lou-almond-croissant', 'b006', 'Croissants', 'The best almond croissant in LA. Pre-order required. Rich almond cream, flaked almonds.'),
('p029', 'Butter Croissant', 'lou-butter-croissant', 'b006', 'Croissants', 'Classically French. Lacy layers, crackly shell, pure butter flavor.'),
('p030', 'Pain au Chocolat', 'lou-pain-au-chocolat', 'b006', 'Croissants', 'Valrhona chocolate batons in perfectly laminated dough.'),

-- Arsicault Bakery (b007) — Best croissant in America
('p031', 'Butter Croissant', 'arsicault-butter-croissant', 'b007', 'Croissants', 'Bon Appétit''s Bakery of the Year. Flaky, buttery, perfect. The GOAT.'),
('p032', 'Almond Croissant', 'arsicault-almond-croissant', 'b007', 'Croissants', 'Rich almond frangipane, toasted almond flakes, powdered sugar.'),
('p033', 'Chocolate Croissant', 'arsicault-chocolate-croissant', 'b007', 'Croissants', 'Dark chocolate batons inside impossibly flaky lamination.'),
('p034', 'Ham & Cheese Croissant', 'arsicault-ham-cheese', 'b007', 'Croissants', 'Savory croissant with ham and gruyère. Crispy outside, melty inside.'),
('p035', 'Morning Bun', 'arsicault-morning-bun', 'b007', 'Croissants', 'Orange zest and cinnamon sugar. Caramelized and addictive.'),

-- B Patisserie (b008) — Kouign-amann royalty
('p036', 'Kouign-Amann Nature', 'b-patisserie-kouign-amann', 'b008', 'Kouign-amann', 'The definitive California kouign-amann. Thick caramelized crust, buttery layers.'),
('p037', 'Kouign-Amann Chocolate', 'b-patisserie-kouign-amann-choc', 'b008', 'Kouign-amann', 'Chocolate version of the signature. Dark chocolate meets caramelized butter.'),
('p038', 'Croissant Nature', 'b-patisserie-croissant', 'b008', 'Croissants', 'Modern French croissant. Clean lamination, deep flavor.'),
('p039', 'Pain Suisse', 'pain-suisse', 'b008', 'Croissants', 'Chocolate chip-studded laminated pastry with pastry cream. Swiss-French classic.'),
('p040', 'Bostock', 'b-patisserie-bostock', 'b008', 'Brioche', 'Twice-baked brioche with almond cream and orange blossom syrup.'),
('p041', 'Butter Mochi', 'butter-mochi', 'b008', 'Mochi', 'Chewy, buttery mochi with a crispy edge. Hawaiian-French crossover.'),
('p042', 'Chocolate Banana Almond Croissant', 'choc-banana-almond-croissant', 'b008', 'Croissants', 'Almond croissant loaded with dark chocolate and banana.'),
('p043', 'Madeleine', 'b-patisserie-madeleine', 'b008', 'Cakes', 'Classic French shell-shaped sponge cake. Light, buttery, lemony.'),
('p044', 'Cherry Oatmeal Toffee Cookie', 'cherry-oatmeal-toffee', 'b008', 'Cookies', 'Chewy oat cookie with dried cherries and house-made toffee.'),

-- Tartine Bakery (b009) — The OG SF bakery
('p045', 'Morning Bun', 'tartine-morning-bun', 'b009', 'Croissants', 'Tartine''s signature: cinnamon sugar with lemon twist. Extra brown and crispy.'),
('p046', 'Double Pain au Chocolat', 'tartine-pain-au-chocolat', 'b009', 'Croissants', '300-400 made daily, sells out by noon. Double the chocolate, extra brown lamination.'),
('p047', 'Frangipane Croissant', 'tartine-frangipane-croissant', 'b009', 'Croissants', 'Almond cream filling, flaked almonds. Pillowy smooth inside, extra brown outside.'),
('p048', 'Banana Cream Tart', 'tartine-banana-cream-tart', 'b009', 'Tarts', 'Buttery shell filled with banana pastry cream and fresh bananas.'),
('p049', 'Lemon Tart', 'tartine-lemon-tart', 'b009', 'Tarts', 'Bright, tangy lemon curd in a crispy tart shell.'),
('p050', 'Bread Pudding', 'tartine-bread-pudding', 'b009', 'Cakes', 'Made with Tartine''s own bread. Custardy, warm, and seasonal.'),
('p051', 'Chocolate Soufflé Cake', 'tartine-chocolate-souffle', 'b009', 'Cakes', 'Dense, fudgy, flourless. Pure Valrhona chocolate intensity.'),
('p052', 'Chocolate Hazelnut Tart', 'tartine-choc-hazelnut-tart', 'b009', 'Tarts', 'Hazelnut praline and dark chocolate ganache in a crispy shell.'),

-- Butter & Crumble (b010) — Daily lines, new-school excellence
('p053', 'Pistachio Cardamom Croissant', 'pistachio-cardamom-croissant', 'b010', 'Croissants', 'The evolution of the pistachio trend. Warm cardamom meets bright pistachio cream.'),
('p054', 'Butter Croissant', 'butter-crumble-croissant', 'b010', 'Croissants', 'Worth the daily line. Shattering flaky layers, deeply buttery.'),
('p055', 'Seasonal Danish', 'butter-crumble-danish', 'b010', 'Danish', 'Rotating seasonal fruit on laminated Danish dough with pastry cream.'),

-- Grand Opening (b011) — Cross-cultural innovation
('p056', 'Coconut Scroll', 'coconut-scroll', 'b011', 'Croissants', 'Laminated like a croissant, inspired by Chinese cocktail bun, filled with frangipane. Peak SF.'),
('p057', 'Seasonal Laminated Pastry', 'grand-opening-seasonal', 'b011', 'Croissants', 'Rotating flavors blending Chinese and French technique.'),

-- Third Culture Bakery (b012) — Invented the mochi muffin
('p058', 'OG Mochi Muffin', 'og-mochi-muffin', 'b012', 'Mochi', 'The original since 2016. Crunchy outside, impossibly chewy inside. Gluten free.'),
('p059', 'Ube Mochi Muffin', 'ube-mochi-muffin', 'b012', 'Mochi', 'Purple yam version. Vibrant color, earthy-sweet flavor, same legendary chew.'),
('p060', 'Matcha Mochi Muffin', 'matcha-mochi-muffin', 'b012', 'Mochi', 'Japanese green tea mochi muffin. Bitter, grassy, chewy.'),
('p061', 'Black Sesame Mochi Muffin', 'black-sesame-mochi-muffin', 'b012', 'Mochi', 'Nutty, toasty black sesame with mochi chew.'),
('p062', 'Mochi Donut', 'third-culture-mochi-donut', 'b012', 'Mochi', 'Chewy mochi donut with rotating glazes.'),

-- Golden Gate Bakery (b013) — Legendary, unpredictable
('p063', 'Egg Custard Tart', 'golden-gate-egg-tart', 'b013', 'Tarts', 'Legendary Chinatown egg tart. Silky custard, flaky shell. Worth the gamble on whether they''re open.'),
('p064', 'Blueberry Egg Tart', 'golden-gate-blueberry-tart', 'b013', 'Tarts', 'Blueberry twist on the classic egg tart.'),

-- Cream Pan (b014) — Japanese-French precision, OC icon
('p065', 'Strawberry Croissant', 'cream-pan-strawberry-croissant', 'b014', 'Croissants', 'Cream Pan''s iconic item. Fresh strawberries, custard cream, flaky croissant. Japanese-French precision.'),
('p066', 'Chocolate Cornet', 'chocolate-cornet', 'b014', 'Bread', 'Horn-shaped bread filled with rich chocolate cream. Japanese bakery classic.'),
('p067', 'Custard Cream Pan', 'custard-cream-pan', 'b014', 'Bread', 'The namesake: soft bread filled with house-made custard cream.'),
('p068', 'Matcha Croissant', 'cream-pan-matcha-croissant', 'b014', 'Croissants', 'Matcha cream in a laminated croissant. Earthy meets buttery.'),
('p069', 'Melon Pan', 'melon-pan', 'b014', 'Bread', 'Japanese melon bread: cookie crust top, soft bread inside.'),

-- 61 Hundred Bread (b015) — OC cult bakery gone brick-and-mortar
('p070', 'Sourdough Croissant', 'sourdough-croissant-61', 'b015', 'Croissants', 'Long-fermented sourdough lamination. Complex, tangy, deeply flaky.'),
('p071', 'Seasonal Sourdough Loaf', 'seasonal-sourdough-61', 'b015', 'Bread', 'Artisan sourdough with seasonal California ingredients.'),
('p072', 'Brown Butter Financier', 'brown-butter-financier', 'b015', 'Cakes', 'Nutty brown butter, crispy edges, tender almond center.');


-- ============================================================
-- TRENDING TAGS (for search/discovery weighting)
-- ============================================================
-- These represent the keywords and trends that should surface
-- higher in discovery feeds and search results.
--
-- Viral/Hot (early 2026):
--   Dubai chocolate, kataifi, pistachio, mochi, sourdough,
--   kouign-amann, break-pull-ooze, cross-cultural fusion
--
-- Established California flavors:
--   matcha, ube, black sesame, hojicha, guava, brown butter,
--   miso caramel, yuzu, cardamom, corn masa
--
-- Texture keywords (19% YoY conversation increase):
--   flaky, crispy, crackly, gooey, chewy, caramelized,
--   pull-apart, layered, underbaked, pillowy
--
-- Cultural crossovers defining California:
--   Japanese-French (Cream Pan)
--   Korean-California (Modu Cafe)
--   Cuban-American (Porto's)
--   Chinese-French (Grand Opening)
--   Mexican-French (corn masa, sourdough conchas)
