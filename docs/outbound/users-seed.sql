-- Run in Supabase SQL Editor after migrations 001, 002, and 003.
-- This script stages all source users and promotes users whose email already
-- exists in Supabase Auth. It never inserts into auth.users or stores passwords.

drop table if exists seed_users;
create temporary table seed_users (
  id text primary key,
  name text not null,
  role text not null,
  email text,
  ops_id text,
  is_fte boolean,
  is_active boolean,
  must_change_password boolean,
  clerk_user_id text,
  password_hash text,
  password_changed_at timestamptz,
  auth_provider text,
  created_at timestamptz,
  updated_at timestamptz
);

insert into seed_users (
  id, name, role, email, ops_id, is_fte, is_active, must_change_password,
  clerk_user_id, password_hash, password_changed_at, auth_provider, created_at, updated_at
) values
  ('4c122e61a337be6b35935be2', 'Jetricks Cantonjos', 'fte_ops', 'jetricks.cantonjos@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('193fd3e4fa7edba756583e8c', 'Jayvee Nolasco', 'fte_ops', 'jayvee.nolasco@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('a59ea0283413bc16ac409b03', 'Jeffreyson Santos', 'fte_ops', 'jeffreyson.santos@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('dc690a23ac4008952f20c019', 'Robert Tan', 'fte_ops', 'robert.tan@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('cd5ee37f30d1d8f40200796e', 'Marichu Busano', 'fte_ops', 'marichu.busano@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('ed9b76eda8563a62e875cad1', 'Mark Fernandez', 'fte_ops', 'romark.fernandez@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('f0fa90915728b04e10c758f9', 'Renzo Rocamora', 'fte_ops', 'renzo.rocamora@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('0276d6da060ef29cb7bdb75a', 'Titay Baylon', 'fte_ops', 'christy.baylon@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('26a208a9a3a7d7788dd36305', 'Greg Las Penas', 'fte_ops', 'gregorio.laspenas@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('0cdb5e0db4ed5bc668b5b5f2', 'Arjay Ramos', 'fte_ops', 'arjay.ramos@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('707c94ccde2fa31c75665a46', 'Albert Borreta', 'fte_ops', 'alberto.borreta@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('33d37a4af9ecaf4da67631b8', 'Leida Gween Estabillo', 'fte_ops', 'leida.estabillo@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('91032cb1644ec3e7025d2136', 'Joanna Tayamen', 'fte_ops', 'joanna.tayamen@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('80ace2fa3cf5a992b3a1ab8c', 'Zaldy Milaya', 'fte_ops', 'zaldy.milaya@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('41213490fe91a7bc9e2b053c', 'Crisjay Aguilar', 'fte_ops', 'crisjay.aguilar@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('b8e1cab0e038074c58766667', 'Joan Siapno', 'fte_ops', 'joan.siapno@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('d7b1932069ec71d5393490c1', 'Norsalin Sencil', 'fte_ops', 'norsalin.sencil@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('2ff44fea7e04b02a41cfa6f9', 'Ernalie Valencia', 'fte_ops', 'ernalie.valencia@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('824306d30bb5e6b4cd756f3a', 'Maria Victoria Pablo', 'fte_ops', 'maria.pablo@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('c8d042c5b3fe87df91dd1a47', 'Darel Matias', 'fte_ops', 'darel.matias@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('8e3c5da02f40d6f009bf576c', 'Charlene Ecleo', 'fte_ops', 'charlene.ecleo@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('f0612a3fd28f895f1d2889e8', 'Jessa Mae Magnaye', 'fte_ops', 'jessa.magnaye@spxexpress.com', null, true, true, false, null, null, null, 'clerk', now(), now()),
  ('f5daee71c16a97a9c52af6a9', 'Galozo, Rea-Ann kris', 'ops_pic', null, 'ops71783', false, true, true, null, null, null, 'clerk', now(), now()),
  ('abf09d3c3b089504b36172ed', 'Saysay,Gretchen', 'ops_pic', null, 'ops4192', false, true, true, null, null, null, 'clerk', now(), now()),
  ('bdf373926195ff89fd82b82c', 'Dimaranan,Jonnel', 'ops_pic', null, 'ops93521', false, true, true, null, null, null, 'clerk', now(), now()),
  ('25df5ab3388123cd9378e5ba', 'Parco,John Airon', 'ops_pic', null, 'ops84881', false, true, true, null, null, null, 'clerk', now(), now()),
  ('14c83d853591b8cea54d250b', 'Sumalde, Nadia', 'ops_pic', null, 'ops100377', false, true, true, null, null, null, 'clerk', now(), now()),
  ('c0a50ca08582743e65a7a79a', 'Brillantes,Jamaica', 'ops_pic', null, 'ops190837', false, true, true, null, null, null, 'clerk', now(), now()),
  ('0435354ffbfbc30c14c20ed0', 'Cabonilas_Jerrie Ann', 'ops_pic', null, 'ops88419', false, true, true, null, null, null, 'clerk', now(), now()),
  ('cd9c449eae11e43fdd305916', 'Fulliente, Alejandra', 'ops_pic', null, 'ops87172', false, true, true, null, null, null, 'clerk', now(), now()),
  ('48b8f4bedee096030b2e4bc7', 'Delos Reyes, Arlyn', 'ops_pic', null, 'ops100055', false, true, true, null, null, null, 'clerk', now(), now()),
  ('cc9377584e9c8fdc670e7314', 'Gramatica,George', 'ops_pic', null, 'ops74547', false, true, true, null, null, null, 'clerk', now(), now()),
  ('5b33beafc7f88077413c2c37', 'Tordillos, Lorenzo', 'ops_pic', null, 'ops84943', false, true, true, null, null, null, 'clerk', now(), now()),
  ('863f0976d08d1eba46cfb8ee', 'Consuelo, Aira Vhel', 'ops_pic', null, 'ops111815', false, true, true, null, null, null, 'clerk', now(), now()),
  ('6863a8e253753d5fb3fe58b7', 'Consuelo,Sherwyn', 'ops_pic', null, 'ops111816', false, true, true, null, null, null, 'clerk', now(), now()),
  ('89649271ece1070848d89e71', 'Llorente, Jessica', 'ops_pic', null, 'ops62450', false, true, true, null, null, null, 'clerk', now(), now()),
  ('7e57fb646b74e6343a6ebabc', 'Cabugwas, Alyssa', 'ops_pic', null, 'ops172207', false, true, true, null, null, null, 'clerk', now(), now()),
  ('536d90c7d4d81228265da5fb', 'Quirre, Madelyn Anne', 'ops_pic', null, 'ops123976', false, true, true, null, null, null, 'clerk', now(), now()),
  ('4be5e9b4ddf1fb5ac3812bfc', 'Bilan, Loren Anne', 'ops_pic', null, 'ops82361', false, true, true, null, null, null, 'clerk', now(), now()),
  ('7d4bf074e1c2778346060e62', 'Lazaro, Austria Joseph', 'ops_pic', null, 'ops80762', false, true, true, null, null, null, 'clerk', now(), now()),
  ('da13058e90e9ce5c18c44012', 'Joselito, Feleo', 'ops_pic', null, 'ops157086', false, true, true, null, null, null, 'clerk', now(), now()),
  ('11fa0a10175fd8af7dfa9387', 'Capistrano, Jayby', 'ops_pic', null, 'ops193979', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b22e170752d13ce7cbed5b47', 'Valenzuela, Evangeline', 'ops_pic', null, 'ops83412', false, true, true, null, null, null, 'clerk', now(), now()),
  ('8bd98c5010008f4d1eeba206', 'Azana, Argie B.', 'ops_pic', null, 'ops76115', false, true, true, null, null, null, 'clerk', now(), now()),
  ('e27c80dcbb71b8fa69d1dff5', 'Dondiego, Salvacion', 'ops_pic', null, 'ops132878', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b20ed50c9b5ac9f9f8435860', 'Mamarinta,Halid', 'ops_pic', null, 'ops205947', false, true, true, null, null, null, 'clerk', now(), now()),
  ('975ff36b54337225cfd38371', 'Leona_Jayson', 'ops_pic', null, 'ops82710', false, true, true, null, null, null, 'clerk', now(), now()),
  ('df21da6fac480f4b053658c7', 'Fullente,Shella Mae', 'ops_pic', null, 'ops138478', false, true, true, null, null, null, 'clerk', now(), now()),
  ('09512920f8481b9f7077cdfa', 'Pagayawan,Khadafe', 'ops_pic', null, 'ops188597', false, true, true, null, null, null, 'clerk', now(), now()),
  ('606ddaf6b77333ad1ceeb68f', 'Salonga, Mike Billy', 'ops_pic', null, 'ops131423', false, true, true, null, null, null, 'clerk', now(), now()),
  ('f775f5aa19b57ba69a6f21b6', 'Guro,Saripoden', 'ops_pic', null, 'ops199353', false, true, true, null, null, null, 'clerk', now(), now()),
  ('e4fecd4fdfc1af6228081a15', 'Dimalaluan,Glenda', 'ops_pic', null, 'ops81920', false, true, true, null, null, null, 'clerk', now(), now()),
  ('fb6aca15cdff4776995759a0', 'Gernale,Gemmalyn', 'ops_pic', null, 'ops113988', false, true, true, null, null, null, 'clerk', now(), now()),
  ('369ac76ba2173c8ad0f7b2b7', 'Bayona,Arbhee John', 'ops_pic', null, 'ops93568', false, true, true, null, null, null, 'clerk', now(), now()),
  ('2600ecbdd51721a74e380a28', 'Malacas, Leonalyn', 'ops_pic', null, 'ops176188', false, true, true, null, null, null, 'clerk', now(), now()),
  ('f5f0d163611c5dff2a41abf3', 'Labado Jr.,Rolando', 'ops_pic', null, 'ops74697', false, true, true, null, null, null, 'clerk', now(), now()),
  ('3e379164d1e810ac3f752b7c', 'Algura,Reymund Campus', 'ops_pic', null, 'ops194930', false, true, true, null, null, null, 'clerk', now(), now()),
  ('06f3e96eacbe3ee98c6c3eae', 'Tayao,Analiza', 'ops_pic', null, 'ops6580', false, true, true, null, null, null, 'clerk', now(), now()),
  ('db67c21e8ca3e4f63062b1a6', 'Cuizon,Richard', 'ops_pic', null, 'ops83960', false, true, true, null, null, null, 'clerk', now(), now()),
  ('9dc009210324b0592738b0aa', 'Shasta, Zabat', 'ops_pic', null, 'ops90681', false, true, true, null, null, null, 'clerk', now(), now()),
  ('e284bdd5062e57252bf1cc01', 'Sesbreno_Janet A.', 'ops_pic', null, 'ops87891', false, true, true, null, null, null, 'clerk', now(), now()),
  ('579fc29bf0004b7b29e91b23', 'Panes,Ailene', 'ops_pic', null, 'ops83471', false, true, true, null, null, null, 'clerk', now(), now()),
  ('279a5ab3031cf19d06ad079f', 'Tarel, Kristine', 'ops_pic', null, 'ops95772', false, true, true, null, null, null, 'clerk', now(), now()),
  ('3a4aaa86d2195b8cf2dba841', 'Tangcangco,Pauline', 'ops_pic', null, 'ops161934', false, true, true, null, null, null, 'clerk', now(), now()),
  ('f6f38a31405a5f448a531b43', 'Divina, Ivan Clyde', 'ops_pic', null, 'ops82968', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b5f31cc11e0e4f022d1dbd7a', 'Landig,Patricia Nicole', 'ops_pic', null, 'ops169232', false, true, true, null, null, null, 'clerk', now(), now()),
  ('bbe743c6bfc919ee7be8b70c', 'Nano,Joey', 'ops_pic', null, 'ops469', false, true, true, null, null, null, 'clerk', now(), now()),
  ('69e863444614502ed81f340c', 'Culagbang,Jimmy', 'ops_pic', null, 'ops72861', false, true, true, null, null, null, 'clerk', now(), now()),
  ('4ce37cddc544ea6fcc01ef12', 'Acosta,Jerico', 'ops_pic', null, 'ops72857', false, true, true, null, null, null, 'clerk', now(), now()),
  ('258c73b4bbc8e7c16d8d8ac1', 'Bumanlag,Mark', 'ops_pic', null, 'ops75928', false, true, true, null, null, null, 'clerk', now(), now()),
  ('5df99b9ad5014f40c0a47f2d', 'Pawil,Dan', 'ops_pic', null, 'ops78057', false, true, true, null, null, null, 'clerk', now(), now()),
  ('9b01472d211d1590cbb9414f', 'Ortega, Ramon', 'ops_pic', null, 'ops78195', false, true, true, null, null, null, 'clerk', now(), now()),
  ('220fd1ff9f4a3280c7acb946', 'Dumpay,Alvin', 'ops_pic', null, 'ops78161', false, true, true, null, null, null, 'clerk', now(), now()),
  ('56354bf73fb0ae130228e06f', 'Saclet, Aldrin', 'ops_pic', null, 'ops88711', false, true, true, null, null, null, 'clerk', now(), now()),
  ('6f983433e5f26b61ae02eba8', 'Ali, Norjannah', 'ops_pic', null, 'ops141504', false, true, true, null, null, null, 'clerk', now(), now()),
  ('0096cba26eeb90ca57dd31cf', 'Bacarisas , Cristian', 'ops_pic', null, 'ops212822', false, true, true, null, null, null, 'clerk', now(), now()),
  ('3a4846ed739a77271f83486f', 'Manglo, Marc Christian', 'ops_pic', null, 'ops72862', false, true, true, null, null, null, 'clerk', now(), now()),
  ('0da4cd0892e98bdc543e7a0c', 'Ezmayaten,Imam', 'ops_pic', null, 'ops87551', false, true, true, null, null, null, 'clerk', now(), now()),
  ('660282fa41c1bfdab088a6a4', 'Magda, Jerberniel', 'ops_pic', null, 'ops78511', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b06ae403ded2f88dc7a11862', 'Mahinay, Angelo', 'ops_pic', null, 'ops245559', false, true, true, null, null, null, 'clerk', now(), now()),
  ('96d65878f518ddd900851757', 'Somera, Israel', 'ops_pic', null, 'ops100268', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b3a565c00c92187c8ac7806b', 'Salcedo, Ricardo', 'ops_pic', null, 'ops130928', false, true, true, null, null, null, 'clerk', now(), now()),
  ('aa19d8eebfe954fbc803fd82', 'Gathalian, Aries', 'ops_pic', null, 'ops175353', false, true, true, null, null, null, 'clerk', now(), now()),
  ('8a8ad6ffd3754b6b7b37bd37', 'Dorado,Al Joseph', 'ops_pic', null, 'ops126881', false, true, true, null, null, null, 'clerk', now(), now()),
  ('400dcda513e5fe755852ad91', 'Quiseo Jr, Allan', 'ops_pic', null, 'ops83488', false, true, true, null, null, null, 'clerk', now(), now()),
  ('1e5f38002934d787273ad169', 'Anaquita, Arturo', 'ops_pic', null, 'ops174599', false, true, true, null, null, null, 'clerk', now(), now()),
  ('f807f89c4712545caaecf2b5', 'Ato,Saima', 'ops_pic', null, 'ops143279', false, true, true, null, null, null, 'clerk', now(), now()),
  ('1a190d259127abb6f02050f6', 'Sencil, Marvin', 'ops_pic', null, 'ops201819', false, true, true, null, null, null, 'clerk', now(), now()),
  ('ce785b428e54decdd445ce67', 'Domalayas, Melvin Grencio', 'ops_pic', null, 'ops163696', false, true, true, null, null, null, 'clerk', now(), now()),
  ('d66085facc6dc4f2853fbcb9', 'Villar, Aldrin', 'ops_pic', null, 'ops209118', false, true, true, null, null, null, 'clerk', now(), now()),
  ('baa8cc76882494a8373c623c', 'Gener,Joselyn', 'ops_pic', null, 'ops205200', false, true, true, null, null, null, 'clerk', now(), now()),
  ('229f3542a335e38c6a8a44c7', 'Camaloden, Abdulfatah', 'ops_pic', null, 'ops132183', false, true, true, null, null, null, 'clerk', now(), now()),
  ('7cc3a7abf0b377c1aa58c07d', 'Orana, Pio', 'ops_pic', null, 'ops80853', false, true, true, null, null, null, 'clerk', now(), now()),
  ('65eceb8b140f1a1f9958693b', 'Ilagan,Rodel', 'ops_pic', null, 'ops94840', false, true, true, null, null, null, 'clerk', now(), now()),
  ('2b1095e00aedf651d474b637', 'Hugo, Jaypee G', 'ops_pic', null, 'ops170880', false, true, true, null, null, null, 'clerk', now(), now()),
  ('909953195882425411ea8ccb', 'Ebay, Arman', 'ops_pic', null, 'ops203901', false, true, true, null, null, null, 'clerk', now(), now()),
  ('a47e2afc1c115f3dbdbb0165', 'Sultan,Buraco', 'ops_pic', null, 'ops145632', false, true, true, null, null, null, 'clerk', now(), now()),
  ('07d791bf61b769755985bb2e', 'Macatinbang, Jobanie', 'ops_pic', null, 'ops179730', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b6016317e012b763e81c9039', 'Cariga,Saifuddin', 'ops_pic', null, 'ops82975', false, true, true, null, null, null, 'clerk', now(), now()),
  ('933925f654c7802c51d4ad68', 'Delfin,Ronel,Mendoza', 'ops_pic', null, 'ops173490', false, true, true, null, null, null, 'clerk', now(), now()),
  ('6d976478234f4073c07d58ab', 'Madrona, Allan Dumas', 'ops_pic', null, 'ops79659', false, true, true, null, null, null, 'clerk', now(), now()),
  ('0b2dd2e45d6b0dc9d3d78f83', 'Parungao,Rolando', 'ops_pic', null, 'ops76320', false, true, true, null, null, null, 'clerk', now(), now()),
  ('4123b30c2267adfbe4bacb92', 'Salunoy, Angelica', 'ops_pic', null, 'ops182916', false, true, true, null, null, null, 'clerk', now(), now()),
  ('dbe0c114d01ac7a3a3137dcb', 'Mambi,Juner', 'ops_pic', null, 'ops84878', false, true, true, null, null, null, 'clerk', now(), now()),
  ('41a5f29db1440775f177c148', 'Entico, Jayson', 'ops_pic', null, 'ops91685', false, true, true, null, null, null, 'clerk', now(), now()),
  ('b768c58ffed1f60451d98de6', 'Apodaca,Jane', 'ops_pic', null, 'ops144485', false, true, true, null, null, null, 'clerk', now(), now()),
  ('eaf8d4ff64a9cc266cd39c7e', 'Manongaarang, Abdol', 'ops_pic', null, 'ops78192', false, true, true, null, null, null, 'clerk', now(), now()),
  ('05c3cf7c8b4a96035c6b225b', 'Abdulazis,Johanie', 'ops_pic', null, 'ops89825', false, true, true, null, null, null, 'clerk', now(), now()),
  ('63d65bae72c284d58b305d33', 'Agsolid, Manuel', 'ops_pic', null, 'ops101553', false, true, true, null, null, null, 'clerk', now(), now())
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  ops_id = excluded.ops_id,
  is_fte = excluded.is_fte,
  is_active = excluded.is_active,
  must_change_password = excluded.must_change_password,
  auth_provider = excluded.auth_provider,
  updated_at = now();

-- Private staging directory. RLS is enabled with no browser policies.
create table if not exists public.user_imports (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  name text not null,
  role public.user_role not null,
  email text unique,
  ops_id text unique,
  is_active boolean not null default true,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  check (email is not null or ops_id is not null)
);

alter table public.user_imports enable row level security;

insert into public.user_imports (
  source_id, name, role, email, ops_id, is_active, auth_user_id
)
select
  source.id,
  source.name,
  source.role::public.user_role,
  nullif(source.email, ''),
  nullif(source.ops_id, ''),
  coalesce(source.is_active, true),
  auth_user.id
from seed_users source
left join auth.users auth_user
  on source.email is not null
 and lower(auth_user.email) = lower(source.email)
on conflict (source_id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  ops_id = excluded.ops_id,
  is_active = excluded.is_active,
  auth_user_id = excluded.auth_user_id,
  imported_at = now();

-- Promote only records backed by a real Supabase Auth UUID.
insert into public.profiles (id, name, role, email, ops_id, is_active)
select auth_user_id, name, role, email, ops_id, is_active
from public.user_imports
where auth_user_id is not null
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  ops_id = excluded.ops_id,
  is_active = excluded.is_active,
  updated_at = now();

select
  count(*) as staged_users,
  count(auth_user_id) as linked_auth_users,
  count(*) filter (where auth_user_id is null) as awaiting_auth_accounts
from public.user_imports;
drop table seed_users;
