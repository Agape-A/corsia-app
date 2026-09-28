-- Corsia — prime strutture pubbliche reali (Toscana)
-- Dati raccolti da fonti pubbliche verificabili (siti ufficiali delle Aziende
-- USL Toscane, PDF regionali, portale Bollini Rosa/Onda) tramite ricerca web
-- del 28/09/2026. Ogni riga riporta la fonte nel campo "note" per poter
-- verificare/aggiornare il dato. Dove telefono o CAP non erano indicati
-- nella fonte, il campo è lasciato NULL invece di essere indovinato.
-- Nessuna prestazione è stata collegata automaticamente alle strutture,
-- tranne per gli ambulatori dove la specialità era esplicita nella fonte
-- (es. "Ambulatorio Pneumologia") — il resto va completato dallo staff
-- dalla pagina Strutture, mano a mano che si verifica cosa offre ciascuna.
--
-- Copertura: solo pubblico/CUP. Le strutture private/convenzionate
-- arriveranno tramite Google Places API (vedi migrazione successiva) o
-- inserimento manuale dello staff.

insert into public.strutture (nome, tipo, indirizzo, comune, cap, provincia, telefono, fonte, note) values
  ('AOU Careggi', 'pubblico', 'Largo Brambilla, 3', 'Firenze', '50134', 'FI', '055 794111', 'cup_regionale_toscana', 'fonte: aou-careggi.toscana.it (pagina "chi siamo"), consultato 28/09/2026'),
  ('Ospedale Santa Maria Nuova', 'pubblico', 'Piazza S.M. Nuova, 1', 'Firenze', null, 'FI', '055 6938111', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale San Giovanni di Dio (Torregalli)', 'pubblico', 'Via di Torregalli, 3', 'Firenze', null, 'FI', '055 69321', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Presidio Ospedaliero San Giuseppe', 'pubblico', 'Viale Boccaccio, 14', 'Empoli', null, 'FI', '0571 7051', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale San Jacopo', 'pubblico', 'Via Ciliegiole, 120', 'Pistoia', null, 'PT', '0573 3521', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale Santo Stefano', 'pubblico', 'Via Suor Niccolina, 20', 'Prato', '59100', 'PO', '0574 801305', 'cup_regionale_toscana', 'fonte: malattierare.gov.it/centri_cura/dettaglio/377, consultato 28/09/2026'),
  ('AOU Pisana (sede legale)', 'pubblico', 'Via Roma, 67', 'Pisa', '56126', 'PI', '050 992111', 'cup_regionale_toscana', 'fonte: ao-pisa.toscana.it, consultato 28/09/2026'),
  ('Presidio Cisanello (AOUP)', 'pubblico', 'Via Paradisa, 2', 'Pisa', '56124', 'PI', null, 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Presidio Ospedaliero Felice Lotti', 'pubblico', 'Via Roma, 180', 'Pontedera', null, 'PI', '0587 273111', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Presidio Ospedaliero di Livorno', 'pubblico', 'Viale Alfieri, 36', 'Livorno', null, 'LI', '0586 223111', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Presidio Ospedaliero S. Luca', 'pubblico', 'Via G. Lippi Francesconi, Loc. San Filippo', 'Lucca', null, 'LU', '0583 9701', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale Apuane', 'pubblico', 'Via Enrico Mattei, 21', 'Massa', null, 'MS', '0585 4931', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale San Donato', 'pubblico', 'Via Pietro Nenni, 20', 'Arezzo', null, 'AR', '0575 2551', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedale della Misericordia', 'pubblico', 'Via Senese, 169', 'Grosseto', null, 'GR', '0564 485940', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('Ospedali Riuniti Val di Chiana (Nottola)', 'pubblico', 'Via Provinciale, 5', 'Montepulciano', null, 'SI', '0578 7131', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),
  ('AOU Senese - Ospedale S.M. alle Scotte', 'pubblico', 'Viale Bracci, 14, Loc. Le Scotte', 'Siena', null, 'SI', '0577 585111', 'cup_regionale_toscana', 'fonte: bollinirosa.it, consultato 28/09/2026'),

  ('Casa della Salute Arezzo', 'pubblico', 'Via XXV Aprile, 18', 'Arezzo', null, 'AR', '0575 379174', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it/case-della-salute/elenco-casa-della-salute, consultato 28/09/2026'),
  ('Casa della Salute Civitella Valdichiana - Badia al Pino', 'pubblico', 'Via Pratomagno, 2', 'Civitella in Val di Chiana', null, 'AR', '0575 379148', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Subbiano', 'pubblico', 'Via Matteotti, 27', 'Subbiano', null, 'AR', '0575 379172', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Ponte a Poppi', 'pubblico', 'Via Nazario Sauro, 8', 'Poppi', null, 'AR', '0575 568910', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute San Giovanni Valdarno', 'pubblico', 'Via 3 Novembre, 18', 'San Giovanni Valdarno', null, 'AR', '055 91061', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Cortona', 'pubblico', 'Via Dardano, 17', 'Cortona', null, 'AR', '0575 639310', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Sansepolcro', 'pubblico', 'Via Montefeltro, 1/d', 'Sansepolcro', null, 'AR', '0575 1690774', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Follonica', 'pubblico', 'Viale Europa, 1', 'Follonica', null, 'GR', '0566 909111', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Pitigliano', 'pubblico', 'Via Nicola Ciacci, 340', 'Pitigliano', null, 'GR', '0564 618111', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Castel del Piano', 'pubblico', 'Via Dante Alighieri', 'Castel del Piano', null, 'GR', '0564 914652', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Poggibonsi', 'pubblico', 'Via della Costituzione, 30', 'Poggibonsi', null, 'SI', '0577 767664', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Abbadia San Salvatore', 'pubblico', 'Piazzale Michelangelo, 26', 'Abbadia San Salvatore', null, 'SI', '0577 786284', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Montepulciano', 'pubblico', 'Viale Calamandrei, 49', 'Montepulciano', null, 'SI', '0578 336400', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),
  ('Casa della Salute Sinalunga', 'pubblico', 'Via Guerrazzi, 1-3', 'Sinalunga', null, 'SI', '0577 535232', 'cup_regionale_toscana', 'fonte: uslsudest.toscana.it, consultato 28/09/2026'),

  ('Ambulatorio Pneumologia Cisanello', 'pubblico', 'Via Paradisa, 2', 'Pisa', '56124', 'PI', '050 996467', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Presidio Distrettuale "La Rosa"', 'pubblico', 'Loc. La Rosa, Via G. Verdi, 32', 'Terricciola', '56030', 'PI', '0587 273853', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Ser.D. Volterra', 'pubblico', 'Via Borgo San Lazzero, 5', 'Volterra', '56048', 'PI', '0588 91938', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Ambulatorio Pneumologia Livorno', 'pubblico', 'Viale Alfieri, 36', 'Livorno', '57100', 'LI', '0586 223453', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Ser.D. Elba', 'pubblico', 'Via Garibaldi, 1', 'Portoferraio', null, 'LI', '0565 930871', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Ambulatorio Pneumologia Lucca', 'pubblico', 'Via Ospedale, 1', 'Lucca', '55100', 'LU', '0583 970650', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('Ser.D. Gallicano', 'pubblico', 'Via IV Novembre, 10', 'Gallicano', '55027', 'LU', '0583 729473', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('SerD Carrara', 'pubblico', 'Via Carriona, 245', 'Carrara', '54033', 'MS', '0585 655239', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026'),
  ('SerD Aulla', 'pubblico', 'Quartiere Gobetti', 'Aulla', '54011', 'MS', '0187 423421', 'cup_regionale_toscana', 'fonte: regione.toscana.it PDF "Nord ovest", consultato 28/09/2026');

-- Colleghiamo solo le prestazioni esplicitamente indicate dalla fonte
-- (gli ambulatori di Pneumologia). Tutto il resto (ospedali generici, case
-- della salute) va completato dallo staff dalla pagina Strutture, perché
-- la fonte non specificava quali prestazioni offre ogni singola sede.
insert into public.strutture_prestazioni (struttura_id, prestazione_codice, disponibilita_online)
select s.id, 'visita-pneumologica', false
from public.strutture s
where s.nome in ('Ambulatorio Pneumologia Cisanello', 'Ambulatorio Pneumologia Livorno', 'Ambulatorio Pneumologia Lucca');
