CREATE ROLE "ai-backend" WITH
	LOGIN
	NOSUPERUSER
	NOCREATEDB
	NOCREATEROLE
	INHERIT
	NOREPLICATION
	NOBYPASSRLS
	CONNECTION LIMIT -1
	PASSWORD 'xxxxxx';


CREATE DATABASE "ai-backend"
    WITH
    OWNER = "ai-backend"
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

\c ai-backend;

CREATE TABLE products
(
    "productId" text NOT NULL,
    "productName" text NOT NULL,
    category text,
    price numeric(9, 2),
    metadata jsonb,
    PRIMARY KEY ("productId")
);

ALTER TABLE IF EXISTS products
    OWNER to "ai-backend";

INSERT INTO products ("productId", "productName", category, price, metadata) VALUES
     ('60435', 'City Polizeistation am Fluss', 'City', 84.99, '{"number_of_parts": 894}'),
     ('60436', 'Arktis-Forschungsschiff', 'City', 99.99, '{"number_of_parts": 1102}'),
     ('75401', 'Galaktischer Raumjäger X-12', 'Space', 69.99, '{"number_of_parts": 731}'),
     ('75402', 'Interstellare Forschungsbasis', 'Space', 149.99, '{"number_of_parts": 1568}'),
     ('10346', 'Mittelalterlicher Marktplatz', 'Icons', 209.99, '{"number_of_parts": 2245}'),
     ('10347', 'Große Ritterfestung', 'Icons', 269.99, '{"number_of_parts": 2982}'),
     ('71825', 'Ninja Tempel der Schatten', 'Ninjago', 109.99, '{"number_of_parts": 1214}'),
     ('71826', 'Ninja Offroad-Buggy', 'Ninjago', 39.99, '{"number_of_parts": 389}'),
     ('42179', 'Technic Schwerlast-Bagger', 'Technic', 149.99, '{"number_of_parts": 1643}'),
     ('42180', 'Technic Supersportwagen XR', 'Technic', 179.99, '{"number_of_parts": 1982}'),
     ('31146', 'Creator Strandvilla 3-in-1', 'Creator 3-in-1', 94.99, '{"number_of_parts": 1021}'),
     ('31147', 'Creator Bergchalet 3-in-1', 'Creator 3-in-1', 79.99, '{"number_of_parts": 856}'),
     ('42620', 'Friends Reiterhof am See', 'Friends', 69.99, '{"number_of_parts": 764}'),
     ('42621', 'Friends Stadtcafé', 'Friends', 49.99, '{"number_of_parts": 512}'),
     ('76940', 'Speed Champions Thunder GT', 'Speed Champions', 24.99, '{"number_of_parts": 276}'),
     ('76941', 'Speed Champions Falcon R', 'Speed Champions', 29.99, '{"number_of_parts": 301}'),
     ('10289', 'Modulares Stadthaus', 'Creator Expert', 249.99, '{"number_of_parts": 2744}'),
     ('10290', 'Modulares Museum', 'Creator Expert', 279.99, '{"number_of_parts": 3105}'),
     ('60437', 'City Flughafen Terminal', 'City', 129.99, '{"number_of_parts": 1356}'),
     ('60438', 'City Müllabfuhr-Zentrale', 'City', 59.99, '{"number_of_parts": 643}'),
     ('75403', 'Space Kolonie auf dem Mars', 'Space', 179.99, '{"number_of_parts": 1889}'),
     ('40512', 'Pirateninsel Versteck', 'Adventure', 89.99, '{"number_of_parts": 978}'),
     ('60520', 'Dschungel-Expedition Basislager', 'City', 54.99, '{"number_of_parts": 588}'),
     ('10412', 'Winterliches Bergdorf', 'Seasonal', 129.99, '{"number_of_parts": 1432}'),
     ('31210', 'Großes Aquarium', 'Art', 199.99, '{"number_of_parts": 2150}'),
     ('10348', 'Botanischer Garten', 'Icons', 119.99, '{"number_of_parts": 1276}'),
     ('42181', 'Technic Rettungshubschrauber', 'Technic', 99.99, '{"number_of_parts": 1104}'),
     ('71827', 'Ninja Drachenarena', 'Ninjago', 79.99, '{"number_of_parts": 842}'),
     ('42622', 'Friends Filmstudio', 'Friends', 99.99, '{"number_of_parts": 1098}'),
     ('31148', 'Creator Leuchtturm an der Küste', 'Creator 3-in-1', 119.99, '{"number_of_parts": 1245}'),
     ('60439', 'City Feuerwehr Hauptquartier', 'City', 109.99, '{"number_of_parts": 1184}'),
     ('60440', 'City Tiefsee-U-Boot', 'City', 49.99, '{"number_of_parts": 512}'),
     ('60441', 'City Straßenbahn-Set', 'City', 69.99, '{"number_of_parts": 734}'),
     ('60442', 'City Baustellenkran XL', 'City', 139.99, '{"number_of_parts": 1456}'),
     ('60443', 'City Bergrettungsstation', 'City', 64.99, '{"number_of_parts": 689}'),
     ('60444', 'City Safari-Geländewagen', 'City', 34.99, '{"number_of_parts": 358}'),
     ('60445', 'City Containerhafen', 'City', 159.99, '{"number_of_parts": 1678}'),
     ('60446', 'City Luxus-Yacht', 'City', 84.99, '{"number_of_parts": 921}'),
     ('60447', 'City Polizeihubschrauber', 'City', 24.99, '{"number_of_parts": 274}'),
     ('60448', 'City Forschungs-Labor', 'City', 79.99, '{"number_of_parts": 842}'),
     ('75404', 'Space Orbitalstation Alpha', 'Space', 189.99, '{"number_of_parts": 2104}'),
     ('75405', 'Space Mondrover Expedition', 'Space', 59.99, '{"number_of_parts": 643}'),
     ('75406', 'Space Asteroiden-Miner', 'Space', 89.99, '{"number_of_parts": 988}'),
     ('75407', 'Space Shuttle Transporter', 'Space', 119.99, '{"number_of_parts": 1322}'),
     ('75408', 'Space Alien Forschungsmodul', 'Space', 54.99, '{"number_of_parts": 577}'),
     ('75409', 'Space Sternenzerstörer Mini', 'Space', 39.99, '{"number_of_parts": 412}'),
     ('75410', 'Space Galaxie-Kreuzer', 'Space', 229.99, '{"number_of_parts": 2456}'),
     ('75411', 'Space Planetenbasis Vega', 'Space', 159.99, '{"number_of_parts": 1734}'),
     ('75412', 'Space Rettungskapsel', 'Space', 18.99, '{"number_of_parts": 198}'),
     ('75413', 'Space Kosmischer Frachter', 'Space', 139.99, '{"number_of_parts": 1502}'),
     ('42182', 'Technic Raupenkran Pro', 'Technic', 269.99, '{"number_of_parts": 2894}'),
     ('42183', 'Technic Elektro-Supersportler', 'Technic', 149.99, '{"number_of_parts": 1654}'),
     ('42184', 'Technic Monstertruck Titan', 'Technic', 84.99, '{"number_of_parts": 934}'),
     ('42185', 'Technic Betonmischer', 'Technic', 69.99, '{"number_of_parts": 756}'),
     ('42186', 'Technic Forstmaschine', 'Technic', 109.99, '{"number_of_parts": 1203}'),
     ('42187', 'Technic Rennmotorrad RS', 'Technic', 59.99, '{"number_of_parts": 641}'),
     ('42188', 'Technic Abschleppwagen XL', 'Technic', 189.99, '{"number_of_parts": 2011}'),
     ('42189', 'Technic Traktor mit Anhänger', 'Technic', 79.99, '{"number_of_parts": 884}'),
     ('42190', 'Technic Schneefräse', 'Technic', 49.99, '{"number_of_parts": 533}'),
     ('42191', 'Technic Flughafenlöschfahrzeug', 'Technic', 99.99, '{"number_of_parts": 1097}'),
     ('71828', 'Ninjago Drachenfestung', 'Ninjago', 169.99, '{"number_of_parts": 1822}'),
     ('71829', 'Ninjago Schatten-Mech', 'Ninjago', 69.99, '{"number_of_parts": 764}'),
     ('71830', 'Ninjago Samurai-Panzer', 'Ninjago', 89.99, '{"number_of_parts": 954}'),
     ('71831', 'Ninjago Ninja-Trainingslager', 'Ninjago', 59.99, '{"number_of_parts": 623}'),
     ('71832', 'Ninjago Drachenjäger', 'Ninjago', 44.99, '{"number_of_parts": 487}'),
     ('71833', 'Ninjago Elementar-Tempel', 'Ninjago', 129.99, '{"number_of_parts": 1345}'),
     ('71834', 'Ninjago Unterwasser-Mech', 'Ninjago', 49.99, '{"number_of_parts": 552}'),
     ('71835', 'Ninjago Ninja-Jet Extreme', 'Ninjago', 74.99, '{"number_of_parts": 811}'),
     ('71836', 'Ninjago Bergversteck', 'Ninjago', 84.99, '{"number_of_parts": 903}'),
     ('71837', 'Ninjago Drachenaltar', 'Ninjago', 34.99, '{"number_of_parts": 368}'),
     ('42623', 'Friends Strandresort', 'Friends', 139.99, '{"number_of_parts": 1544}'),
     ('42624', 'Friends Tierheim', 'Friends', 64.99, '{"number_of_parts": 678}'),
     ('42625', 'Friends Musikfestival Bühne', 'Friends', 79.99, '{"number_of_parts": 843}'),
     ('42626', 'Friends Baumhaus-Abenteuer', 'Friends', 64.99, '{"number_of_parts": 721}'),
     ('42627', 'Friends Stadtbibliothek', 'Friends', 84.99, '{"number_of_parts": 934}'),
     ('42628', 'Friends Reitturnier Arena', 'Friends', 99.99, '{"number_of_parts": 1102}'),
     ('42629', 'Friends Tierarztmobil', 'Friends', 24.99, '{"number_of_parts": 276}'),
     ('42630', 'Friends Filmset Abenteuer', 'Friends', 89.99, '{"number_of_parts": 989}'),
     ('42631', 'Friends Kunststudio', 'Friends', 39.99, '{"number_of_parts": 402}'),
     ('42632', 'Friends Sommerhaus', 'Friends', 109.99, '{"number_of_parts": 1204}'),
     ('31149', 'Creator Großstadt Apartment 3-in-1', 'Creator 3-in-1', 119.99, '{"number_of_parts": 1321}'),
     ('31150', 'Creator Piratenschiff 3-in-1', 'Creator 3-in-1', 119.99, '{"number_of_parts": 1267}'),
     ('31151', 'Creator Wildpark 3-in-1', 'Creator 3-in-1', 79.99, '{"number_of_parts": 842}'),
     ('31152', 'Creator Rennflugzeug 3-in-1', 'Creator 3-in-1', 34.99, '{"number_of_parts": 387}'),
     ('31153', 'Creator Mittelalterturm 3-in-1', 'Creator 3-in-1', 89.99, '{"number_of_parts": 956}'),
     ('31154', 'Creator Raumstation 3-in-1', 'Creator 3-in-1', 94.99, '{"number_of_parts": 1043}'),
     ('31155', 'Creator Safari-Lodge 3-in-1', 'Creator 3-in-1', 109.99, '{"number_of_parts": 1188}'),
     ('31156', 'Creator Hafenkran 3-in-1', 'Creator 3-in-1', 59.99, '{"number_of_parts": 623}'),
     ('31157', 'Creator Wikingerboot 3-in-1', 'Creator 3-in-1', 69.99, '{"number_of_parts": 764}'),
     ('31158', 'Creator Jahrmarkt 3-in-1', 'Creator 3-in-1', 129.99, '{"number_of_parts": 1399}'),
     ('10349', 'Icons Klassisches Auto', 'Icons', 139.99, '{"number_of_parts": 1456}'),
     ('10350', 'Icons Botanische Sammlung', 'Icons', 169.99, '{"number_of_parts": 1876}'),
     ('10351', 'Icons Historische Dampflok', 'Icons', 199.99, '{"number_of_parts": 2214}'),
     ('10352', 'Icons Leuchtturm Deluxe', 'Icons', 189.99, '{"number_of_parts": 2098}'),
     ('10353', 'Icons Winterdorf Marktplatz', 'Icons', 159.99, '{"number_of_parts": 1765}'),
     ('10354', 'Icons Großes Theater', 'Icons', 289.99, '{"number_of_parts": 3120}'),
     ('10355', 'Icons Retro Computer', 'Icons', 79.99, '{"number_of_parts": 864}'),
     ('10356', 'Icons Raumfähre Classic', 'Icons', 139.99, '{"number_of_parts": 1543}'),
     ('10357', 'Icons Königliche Kutsche', 'Icons', 89.99, '{"number_of_parts": 978}'),
     ('10358', 'Icons Museum der Wissenschaft', 'Icons', 259.99, '{"number_of_parts": 2844}'),
     ('76942', 'Speed Champions Falcon X', 'Speed Champions', 29.99, '{"number_of_parts": 298}'),
     ('76943', 'Speed Champions Vortex GT', 'Speed Champions', 29.99, '{"number_of_parts": 287}'),
     ('76944', 'Speed Champions Lightning R', 'Speed Champions', 29.99, '{"number_of_parts": 305}'),
     ('76945', 'Speed Champions Night Racer', 'Speed Champions', 24.99, '{"number_of_parts": 276}'),
     ('76946', 'Speed Champions Aero S', 'Speed Champions', 24.99, '{"number_of_parts": 264}'),
     ('76947', 'Speed Champions Desert Rally', 'Speed Champions', 29.99, '{"number_of_parts": 312}'),
     ('76948', 'Speed Champions Hyperion ZX', 'Speed Champions', 29.99, '{"number_of_parts": 289}'),
     ('76949', 'Speed Champions Storm GT3', 'Speed Champions', 29.99, '{"number_of_parts": 301}'),
     ('76950', 'Speed Champions Urban Drift', 'Speed Champions', 29.99, '{"number_of_parts": 278}'),
     ('76951', 'Speed Champions Electro Racer', 'Speed Champions', 29.99, '{"number_of_parts": 296}'),
     ('31211', 'Art Weltkarte Modern', 'Art', 269.99, '{"number_of_parts": 2890}'),
     ('31212', 'Art Tierporträts Set', 'Art', 139.99, '{"number_of_parts": 1456}'),
     ('31213', 'Art Abstrakte Formen', 'Art', 89.99, '{"number_of_parts": 998}'),
     ('31214', 'Art Blumenmosaik', 'Art', 159.99, '{"number_of_parts": 1764}'),
     ('31215', 'Art Sternenhimmel', 'Art', 199.99, '{"number_of_parts": 2134}'),
     ('10413', 'Seasonal Weihnachtsmarkt', 'Seasonal', 149.99, '{"number_of_parts": 1567}'),
     ('10414', 'Seasonal Osterdorf', 'Seasonal', 79.99, '{"number_of_parts": 834}'),
     ('10415', 'Seasonal Halloween Haus', 'Seasonal', 109.99, '{"number_of_parts": 1123}'),
     ('10416', 'Seasonal Sommerfest', 'Seasonal', 59.99, '{"number_of_parts": 645}'),
     ('10417', 'Seasonal Erntedank Scheune', 'Seasonal', 89.99, '{"number_of_parts": 978}');
