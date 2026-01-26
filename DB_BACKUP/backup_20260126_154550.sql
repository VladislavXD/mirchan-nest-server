--
-- PostgreSQL database dump
--

\restrict dR58LnbhTidddKT3EEy1Do075g6UbR9HQAj0RbsvINmaWG9EzMFDFb8bNPF715x

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: AuthMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuthMethod" AS ENUM (
    'CREDENTIALS',
    'GOOGLE',
    'GITHUB',
    'YANDEX'
);


--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TokenType" AS ENUM (
    'VERIFICATION',
    'TWO_FACTOR',
    'PASSWORD_RESET'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'REGULAR',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Ban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ban" (
    id text NOT NULL,
    "ipHash" text NOT NULL,
    "boardId" text,
    reason text NOT NULL,
    "moderatorId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Board; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Board" (
    id text NOT NULL,
    name text NOT NULL,
    title text NOT NULL,
    description text,
    "isNsfw" boolean DEFAULT false NOT NULL,
    "maxFileSize" integer DEFAULT 5242880 NOT NULL,
    "allowedFileTypes" text[] DEFAULT ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'webm'::text, 'mp4'::text],
    "postsPerPage" integer DEFAULT 15 NOT NULL,
    "threadsPerPage" integer DEFAULT 10 NOT NULL,
    "bumpLimit" integer DEFAULT 500 NOT NULL,
    "imageLimit" integer DEFAULT 150 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Categories" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "imageUrl" text,
    icon text,
    color text,
    description text,
    "parentId" text,
    "group" text
);


--
-- Name: Chat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chat" (
    id text NOT NULL,
    "lastMessage" text,
    "lastMessageAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    participants text[]
);


--
-- Name: Comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    content text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Follows" (
    id text NOT NULL,
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Like; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Like" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MediaFile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MediaFile" (
    id text NOT NULL,
    url text NOT NULL,
    "publicId" text NOT NULL,
    name text,
    size integer,
    type text NOT NULL,
    "mimeType" text NOT NULL,
    "thumbnailUrl" text,
    width integer,
    height integer,
    duration integer,
    "threadId" text,
    "replyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    content text NOT NULL,
    "senderId" text NOT NULL,
    "chatId" text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ModAction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ModAction" (
    id text NOT NULL,
    "moderatorId" text NOT NULL,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    reason text,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notice" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    active boolean DEFAULT true NOT NULL,
    type text NOT NULL,
    title text,
    "emojiUrl" text
);


--
-- Name: Post; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    content text NOT NULL,
    "imageUrl" text,
    "emojiUrls" text[],
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    views text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: Reply; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reply" (
    id text NOT NULL,
    "shortId" text NOT NULL,
    "threadId" text NOT NULL,
    content text NOT NULL,
    "authorName" text,
    "authorTrip" text,
    "posterHash" text NOT NULL,
    "postNumber" integer NOT NULL,
    "imageCount" integer DEFAULT 0 NOT NULL,
    "imageUrl" text,
    "imagePublicId" text,
    "imageName" text,
    "imageSize" integer,
    "thumbnailUrl" text,
    "replyTo" text[] DEFAULT ARRAY[]::text[],
    "quotedBy" text[] DEFAULT ARRAY[]::text[],
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    color text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Thread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Thread" (
    id text NOT NULL,
    "shortId" text NOT NULL,
    slug text,
    "boardId" text NOT NULL,
    subject text,
    content text NOT NULL,
    "authorName" text,
    "authorTrip" text,
    "posterHash" text NOT NULL,
    "imageUrl" text,
    "imagePublicId" text,
    "imageName" text,
    "imageSize" integer,
    "thumbnailUrl" text,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "replyCount" integer DEFAULT 0 NOT NULL,
    "imageCount" integer DEFAULT 0 NOT NULL,
    "uniquePosters" integer DEFAULT 1 NOT NULL,
    "lastBumpAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "categoryId" text
);


--
-- Name: ThreadTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ThreadTag" (
    id text NOT NULL,
    "threadId" text NOT NULL,
    "tagId" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id text
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    id text NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    type public."TokenType" NOT NULL,
    expires_in timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    name text,
    username text DEFAULT 'пользователь mirchan'::text,
    status text DEFAULT 'В поисках интересных тем… '::text,
    "avatarUrl" text,
    "avatarFrameUrl" text,
    "backgroundUrl" text,
    "usernameFrameUrl" text,
    "dateOfBirth" timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'REGULAR'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    method public."AuthMethod" NOT NULL,
    is_two_factor_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    bio text,
    location text,
    "lastSeen" timestamp(3) without time zone,
    "googleId" text,
    provider text
);


--
-- Data for Name: Ban; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ban" (id, "ipHash", "boardId", reason, "moderatorId", "expiresAt", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: Board; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Board" (id, name, title, description, "isNsfw", "maxFileSize", "allowedFileTypes", "postsPerPage", "threadsPerPage", "bumpLimit", "imageLimit", "isActive", "createdAt") FROM stdin;
0fc9a267-03aa-4ac3-8af9-18bcdf11e822	b	Random	Случайное обсуждение	t	5242880	{jpg,jpeg,png,gif,webp,webm,mp4}	15	10	500	150	t	2025-09-04 19:40:04.429
86a4ad8b-25c3-41d1-8f9c-09a29c584ede	g	Technology	Технологии и программирование	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-04 19:40:05.537
204b69cd-74e4-4c29-8a54-73cf6613ab7b	v	Video Games	Видеоигры	f	10485760	{jpg,jpeg,png,gif,webp,webm,mp4}	15	10	500	150	t	2025-09-04 19:40:06.669
9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	a	Anime & Manga	Аниме и манга	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-04 19:40:07.872
4c521593-65a6-443e-9a30-cad2ff89c93e	pol	Politics	Политика (с осторожностью)	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	300	100	t	2025-09-04 19:40:08.871
5ba7d0f2-3e9a-4323-95b5-b63fa58ee11f	test	Test Board	Тестовый борд для проверки функциональности	f	8388608	{jpg,jpeg,png,gif,webp}	20	15	400	120	t	2025-09-04 19:50:00.385
3e2e776d-e813-4770-a85e-62eea88b44bc	t	test board	тестовый боард	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-04 20:38:02.299
dbd91c3f-a735-4067-963a-a2c4dd77d701	girls	pretty girls	тестовый борд	t	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:44:06.786
db329465-5201-4453-9720-d80bf43721b1	hh	radmin name	test board	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:45:34.143
46aeda3c-7fbb-43f5-b2ba-f9e6c1e7d6f6	tt	test ajhsb	test board	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:46:03.517
fe588b19-491f-4ce8-93d8-b0def64269e2	q	test ajhsb	test board	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:48:12.762
11868b97-5b13-44e8-8bc2-81469ab03d57	z	sfsfd	test board	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:52:36.003
bb58f40f-9263-4529-80df-14fff6a62e2b	h	sfsfdsdsa	test boardasd	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:53:18.647
44f09fff-b7d8-4b06-b078-59fc14c57d72	dd	smdlkmdlksf	testedmdkcsmdc	t	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:56:01.363
a5a70051-4322-4698-9e7c-e85d09196d0f	ss	edfewffew	wefewfwf	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-09-06 16:59:22.741
0a52235f-1a78-4fc6-b30a-334b6abec9e7	ig	Instagram	Обсуждения Instagram контента, фото, историй	f	5242880	{jpg,jpeg,png,gif,webp,webm,mp4}	15	10	500	150	t	2025-09-12 10:22:08.604
e612e178-2cce-43ca-a395-eab3543dfb7e	of	OnlyFans	OnlyFans контент и обсуждения	t	5242880	{jpg,jpeg,png,gif,webp,webm,mp4}	15	10	500	150	t	2025-09-12 10:22:10.008
beb0b6a7-38ab-4eb4-bdff-1bedc2d5ff42	yt	YouTube	YouTube видео, каналы, обзоры	f	5242880	{jpg,jpeg,png,gif,webp,webm,mp4}	15	10	500	150	t	2025-09-12 10:22:11.556
fac97a5d-1f45-4b44-bbba-6bc399c09afd	bordt	random name	test desc	f	5242880	{jpg,jpeg,png,gif,webp}	10	10	500	150	t	2025-09-12 12:41:58.327
5550ad82-c47b-4b9d-be34-779895785562	l	test	\N	f	5242880	{jpg,jpeg,png,gif,webp}	15	10	500	150	t	2025-11-16 11:53:55.396
\.


--
-- Data for Name: Categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Categories" (id, name, slug, "imageUrl", icon, color, description, "parentId", "group") FROM stdin;
1f0e9957-533f-4e0b-98d5-bc804c2bbcb2	Youtube	youtube	https://res.cloudinary.com/ddzprakot/image/upload/v1757684384/mirchanForumMedia/categories/ikv4mf3igydztekb9hz2.png	\N	#ae2029	Руководства сообщества YouTube не одобряют	\N	social-media
2c63bdb2-eaa1-40aa-a4b0-18bcb9b3b1f3	Instagram	instagram	https://res.cloudinary.com/ddzprakot/image/upload/v1757745373/mirchanForumMedia/categories/hmhytqirhg2bgorfzxnq.png	\N	\N	Самые горячие модели Instagram, без мотивационных цитат, картинок еды или постов на вашем корме от того двоюродного брата, которого вы ненавидите.	\N	social-media
b78223e6-7f17-41b5-ac40-433bf590e8c0	Twitch	twitch	https://res.cloudinary.com/ddzprakot/image/upload/v1757750015/mirchanForumMedia/categories/opizm5c94l5dn1bvqxph.png	\N	#a943ff	Настоящий дом Мирчана. И что -то, что включает в себя гидромассажные ванны? Как только вы входите, нет возвращения.	\N	social-media
eac134b1-7dc1-47dd-9426-5d4f06d4fb8a	TikTok	tiktok	https://res.cloudinary.com/ddzprakot/image/upload/v1757750506/mirchanForumMedia/categories/oymjtioffrpfc86xp68c.png	\N	#0000	Когда алгоритм не совсем дал вам то, что вы хотите, вы обнаружите, что самый горячий тикток может предложить здесь.	\N	social-media
b3d733db-7e26-49fc-a599-8fad3821b4ce	Reddit	reddit	https://res.cloudinary.com/ddzprakot/image/upload/v1757750690/mirchanForumMedia/categories/sundl1144dmlz4av6ecl.png	\N	#ff4b08	Почти как Reddit, только без пустой болтовни и с контентом, который не пропадёт	\N	social-media
4addcdd4-bfe1-46a5-860a-35f2cbaa9bae	ASMR	asmr	https://res.cloudinary.com/ddzprakot/image/upload/v1757751008/mirchanForumMedia/categories/umq3w2bksnxmujo82qsa.jpg	\N	\N	Эй, как дела, малышка? Дай-ка я прошепчу тебе на ушко	\N	Specialised
\.


--
-- Data for Name: Chat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Chat" (id, "lastMessage", "lastMessageAt", "createdAt", "updatedAt", participants) FROM stdin;
f0a323a1-09e9-4a96-9d52-a2a39557dd0c	\N	\N	2025-09-02 15:56:40.744	2025-09-02 15:56:40.744	{e5fbff75-13b4-4121-9fb7-d320c58c6234,17149290-e755-4306-8b69-44a6e1fda70b}
8cba88db-5bd2-46e1-8c9f-40ce99ec457c	hello world	2025-11-14 15:45:00.513	2025-11-12 10:01:06.407	2025-11-14 15:45:00.515	{17149290-e755-4306-8b69-44a6e1fda70b,467661e1-c998-4856-9f6e-82cfa83802f6}
e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	хай	2025-11-14 19:49:59.28	2025-11-14 15:46:32.08	2025-11-14 19:49:59.281	{69eacf97-c138-4e82-bed0-66fa3752d78a,17149290-e755-4306-8b69-44a6e1fda70b}
c2e96187-759f-4656-8092-b348acdc6363	надеюсь работает	2025-12-22 22:03:11.948	2025-09-04 17:58:11.937	2025-12-22 22:03:11.948	{207b302d-6504-4e0a-be43-5831cba49e2a,17149290-e755-4306-8b69-44a6e1fda70b}
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Comment" (id, content, "userId", "postId", "createdAt") FROM stdin;
e5e82687-080b-471c-b2d4-cc90d5b1e9cf	Щас глянем	17149290-e755-4306-8b69-44a6e1fda70b	1e01994e-1828-4bfb-b8c5-baa9c2c2929f	2025-11-16 16:06:43.641
8afba74c-ffbb-4857-982a-e82c682d66da	С его днем рождения	17149290-e755-4306-8b69-44a6e1fda70b	9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	2025-11-16 16:06:43.641
a70b329e-35b4-4888-9189-45c50dae4b55	кстати, нужно сделать возможность отмечать людей 	17149290-e755-4306-8b69-44a6e1fda70b	9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	2025-11-16 16:06:43.641
8479855d-94d4-42c7-ac06-bc48b57e978a	А ты закажи внешний накопитель на 1 террабайт. Хз есть ли что-то наподобие вб в Казахстане\n\n	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	4921a630-1bfd-4604-b451-f79926da6eca	2025-11-16 16:06:43.641
ff03a948-d462-4506-b085-060588333bc9	у нас по инету оно рублей 500 стоит, а в магазинах техники бля десятки рубасов	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	4921a630-1bfd-4604-b451-f79926da6eca	2025-11-16 16:06:43.641
dbb3a26e-6bed-4255-a5b4-5ac7b8d5fd3b	я стоял на лодке и держал весло	17149290-e755-4306-8b69-44a6e1fda70b	dc878954-fae6-4519-aeff-a94f0e3c8021	2025-11-16 16:06:43.641
a355599a-3ee2-4cc1-b8ae-28125ed943d5	test	17149290-e755-4306-8b69-44a6e1fda70b	8be5aa2f-3f37-4ef6-9894-0559150dd01f	2026-01-16 16:01:55.894
\.


--
-- Data for Name: Follows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Follows" (id, "followerId", "followingId", "createdAt") FROM stdin;
79588181-2314-44b4-8e26-561a9b95a06c	e5fbff75-13b4-4121-9fb7-d320c58c6234	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-16 16:06:43.049
63c1e53f-7994-46a7-bb4a-6b6e3ab2bd50	207b302d-6504-4e0a-be43-5831cba49e2a	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-16 16:06:43.049
9f64fec4-4d06-4a5a-b0aa-de62e643ca03	207b302d-6504-4e0a-be43-5831cba49e2a	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-11-16 16:06:43.049
b51e3bee-ef3d-483b-a409-9b72060417d8	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	207b302d-6504-4e0a-be43-5831cba49e2a	2025-11-16 16:06:43.049
42647d86-7c1e-44eb-98bf-f148ad5a59e7	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-16 16:06:43.049
2e88b2be-06fe-463e-9790-73360f462c88	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	e5fbff75-13b4-4121-9fb7-d320c58c6234	2025-11-16 16:06:43.049
9dd218cc-7c47-4ee5-a192-503b09936df3	17149290-e755-4306-8b69-44a6e1fda70b	207b302d-6504-4e0a-be43-5831cba49e2a	2025-11-16 16:06:43.049
004b1d99-f49f-4f80-85b8-53c1f2dd5e5f	17149290-e755-4306-8b69-44a6e1fda70b	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-11-16 16:06:43.049
740535e0-f04b-48c6-87d2-b120d9780800	69eacf97-c138-4e82-bed0-66fa3752d78a	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-16 16:06:43.049
fd5e9529-b003-4feb-b225-55bee2c56d8c	17149290-e755-4306-8b69-44a6e1fda70b	69eacf97-c138-4e82-bed0-66fa3752d78a	2025-12-22 21:51:41.102
\.


--
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Like" (id, "userId", "postId", "createdAt") FROM stdin;
40539715-e994-4675-af26-f75f5b7c362b	e5fbff75-13b4-4121-9fb7-d320c58c6234	a533486f-767d-4110-aaee-a4d85c5fd5de	2025-11-16 16:06:43.459
b8964574-20df-4906-8c29-7ad774769d9a	17149290-e755-4306-8b69-44a6e1fda70b	74d8810b-1e76-4e97-b6d2-2418b12bb376	2025-11-16 16:06:43.459
7b2d0389-cd9f-42d1-8708-6b4938b3e1a9	e5fbff75-13b4-4121-9fb7-d320c58c6234	74d8810b-1e76-4e97-b6d2-2418b12bb376	2025-11-16 16:06:43.459
ca55a925-a35d-49a5-bd2b-1e27d8d17128	207b302d-6504-4e0a-be43-5831cba49e2a	74d8810b-1e76-4e97-b6d2-2418b12bb376	2025-11-16 16:06:43.459
649edffe-5f45-43ef-aac0-973010a7244a	17149290-e755-4306-8b69-44a6e1fda70b	1669c8a1-782e-4c95-9d5d-0578f5bfdbed	2025-11-16 16:06:43.459
55510d5b-57a9-46b0-b7c5-44b625d3d691	17149290-e755-4306-8b69-44a6e1fda70b	4921a630-1bfd-4604-b451-f79926da6eca	2025-11-16 16:06:43.459
95daf6ae-eb94-4786-b468-bd8f9b4cf4af	207b302d-6504-4e0a-be43-5831cba49e2a	4921a630-1bfd-4604-b451-f79926da6eca	2025-11-16 16:06:43.459
ac5c4ff6-bb4c-4a7c-bd4c-629452b9b0d4	207b302d-6504-4e0a-be43-5831cba49e2a	1669c8a1-782e-4c95-9d5d-0578f5bfdbed	2025-11-16 16:06:43.459
672880ff-7e61-4b5c-a5c2-6bd2e33a7c4c	207b302d-6504-4e0a-be43-5831cba49e2a	49addcbe-3e05-409d-a740-3c570db2a6ae	2025-11-16 16:06:43.459
aeb5af1b-9668-4b9a-bdb5-25e407dd33c4	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	1e01994e-1828-4bfb-b8c5-baa9c2c2929f	2025-11-16 16:06:43.459
3f11c684-f75c-464a-985d-2ad886c5f42d	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	df05f48f-d055-4b97-b433-609ee10703a8	2025-11-16 16:06:43.459
71fffcb2-12d1-428d-8efe-cafeae528e1e	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	ce231dab-c838-4356-a90f-54bb7304fd8a	2025-11-16 16:06:43.459
8bcb235e-99f4-44b5-8b61-31837ef8142a	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	7922b02f-4261-4b77-b2ea-a96f046a6b13	2025-11-16 16:06:43.459
d56d0bfc-c15e-4ecf-a694-594654f0ff07	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	49addcbe-3e05-409d-a740-3c570db2a6ae	2025-11-16 16:06:43.459
9640b913-641d-46a3-b24b-3307369e9da5	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	4921a630-1bfd-4604-b451-f79926da6eca	2025-11-16 16:06:43.459
7e906c12-6831-4bab-8bf0-5c4876fcb7fa	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	1669c8a1-782e-4c95-9d5d-0578f5bfdbed	2025-11-16 16:06:43.459
6848b31e-bff7-4898-8bde-7d553ba38262	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	74d8810b-1e76-4e97-b6d2-2418b12bb376	2025-11-16 16:06:43.459
5a03a93a-7dd9-4c93-8d7a-57c5eaf40d30	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	88095831-5008-49a0-ba18-9d126f392af3	2025-11-16 16:06:43.459
2d5fc6b1-c155-4da1-90f3-56a790a877d1	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	a533486f-767d-4110-aaee-a4d85c5fd5de	2025-11-16 16:06:43.459
5d694ba7-af4f-46e4-8856-9ba035ce671f	17149290-e755-4306-8b69-44a6e1fda70b	1e01994e-1828-4bfb-b8c5-baa9c2c2929f	2025-11-16 16:06:43.459
eb8a981a-e780-49cd-8cd3-0931f16c0dfd	17149290-e755-4306-8b69-44a6e1fda70b	df05f48f-d055-4b97-b433-609ee10703a8	2025-11-16 16:06:43.459
e7d822de-7a57-43ea-b718-995731e7ae42	17149290-e755-4306-8b69-44a6e1fda70b	f4eb1e43-5510-4e1b-a925-34c36149959d	2025-11-16 16:06:43.459
c39486f9-e225-46e1-98ab-4babaab3b76c	17149290-e755-4306-8b69-44a6e1fda70b	d1a5977f-90b0-432b-a9b0-415feea70197	2025-11-16 16:06:43.459
970720eb-e5aa-461a-b899-7710c12d927e	17149290-e755-4306-8b69-44a6e1fda70b	f8fb932e-e4df-47be-808e-fd87bf6d0074	2025-11-16 16:06:43.459
c0fe06a6-1ded-46cf-b19d-27e46f2d3d63	207b302d-6504-4e0a-be43-5831cba49e2a	9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	2025-11-16 16:06:43.459
cc3d08e2-c3bc-4bfc-944d-ab5639ddb773	17149290-e755-4306-8b69-44a6e1fda70b	9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	2025-11-16 16:06:43.459
0056483e-8f0a-4e0c-b6da-a806afe8bc9e	17149290-e755-4306-8b69-44a6e1fda70b	969bb712-8f8c-4af2-80a2-9b855ca2b745	2025-11-16 16:06:43.459
e7d5c81d-9a86-4043-9462-506b0faeaed7	17149290-e755-4306-8b69-44a6e1fda70b	789df1d0-c02f-4daa-b236-5b2e05d6f6d3	2025-11-16 16:06:43.459
623aae64-71c3-431e-a7e9-45cd712c87b5	207b302d-6504-4e0a-be43-5831cba49e2a	789df1d0-c02f-4daa-b236-5b2e05d6f6d3	2025-11-16 16:06:43.459
f800823e-1199-4e5d-99b4-70f10e154b73	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	3015d562-62cf-4e90-ae92-79003cc08533	2025-11-16 16:06:43.46
070cc608-f041-49c2-832f-eb7aa03725d9	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	969bb712-8f8c-4af2-80a2-9b855ca2b745	2025-11-16 16:06:43.46
a91424a3-a455-4207-baba-39c32b3a1374	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	789df1d0-c02f-4daa-b236-5b2e05d6f6d3	2025-11-16 16:06:43.46
976a5253-2b84-4910-8cc0-78c5ff996802	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	2025-11-16 16:06:43.46
9ef98770-0e71-4e1f-b49c-9db86eaf9394	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	f8fb932e-e4df-47be-808e-fd87bf6d0074	2025-11-16 16:06:43.46
bbd08e48-7466-4f1d-9f45-a653804d6368	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	d1a5977f-90b0-432b-a9b0-415feea70197	2025-11-16 16:06:43.46
b3b7c2ed-9443-4d65-a4ec-738bfc89acdf	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	f4eb1e43-5510-4e1b-a925-34c36149959d	2025-11-16 16:06:43.46
5f3179a7-3bbe-48d2-b17d-197eaee21893	17149290-e755-4306-8b69-44a6e1fda70b	dc405dc4-aa3a-48b2-9f18-cc0c13f8a01c	2025-11-16 16:06:43.46
4b58f402-e493-490c-93ab-50c7c695dc63	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	92fa4fdb-c122-442a-9373-b4d52a55e1e1	2025-11-16 16:06:43.46
16659354-27ff-4160-abee-95b7a2b42de8	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	cc0c5452-2d68-47f9-af07-cd556fb3812f	2025-11-16 16:06:43.46
88d5c3f8-fb8e-4252-9dac-7777ab0f9e23	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	7151204d-5837-4a24-9f61-ecdcfe1ea298	2025-11-16 16:06:43.46
c3b2554a-8b33-4126-bdda-1b586bdbbb39	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	dc405dc4-aa3a-48b2-9f18-cc0c13f8a01c	2025-11-16 16:06:43.46
04e7ed37-bd7d-4eee-b7d5-fe506bfe1e94	17149290-e755-4306-8b69-44a6e1fda70b	cc0c5452-2d68-47f9-af07-cd556fb3812f	2025-11-16 16:06:43.46
234aa90e-ef15-47b6-bedb-31b4ab505de7	17149290-e755-4306-8b69-44a6e1fda70b	dc878954-fae6-4519-aeff-a94f0e3c8021	2025-11-16 16:06:43.46
40cd221b-182b-480e-9943-1059abd0f484	17149290-e755-4306-8b69-44a6e1fda70b	eae191c3-ec43-44e6-b00e-a8b3df3d65f6	2025-11-16 16:06:43.46
02bf5f6e-48a0-46ff-9ba7-9e0bf18eea2f	17149290-e755-4306-8b69-44a6e1fda70b	f96da602-ccfa-40f2-9781-86702b9058e4	2025-11-16 16:06:43.46
c5c4e352-392c-482b-832d-b394dfbfd6ca	17149290-e755-4306-8b69-44a6e1fda70b	7a152f33-0f01-4232-ac14-fe06329ffcb3	2025-11-16 16:06:43.46
d74ec917-f034-4ffc-8b2c-bce4d91e1e36	467661e1-c998-4856-9f6e-82cfa83802f6	f96da602-ccfa-40f2-9781-86702b9058e4	2025-11-16 16:06:43.46
5b919e89-779d-419c-9b30-6f78bd5f8768	467661e1-c998-4856-9f6e-82cfa83802f6	7a152f33-0f01-4232-ac14-fe06329ffcb3	2025-11-16 16:06:43.46
0b3761b6-bafe-45fc-ab7c-c9d22fbbb994	467661e1-c998-4856-9f6e-82cfa83802f6	dc878954-fae6-4519-aeff-a94f0e3c8021	2025-11-16 16:06:43.46
b6983888-1f47-4de6-9879-fe43a26bd9a8	467661e1-c998-4856-9f6e-82cfa83802f6	eae191c3-ec43-44e6-b00e-a8b3df3d65f6	2025-11-16 16:06:43.46
68bc3be1-475b-4a9b-a219-f26c5a429ec5	467661e1-c998-4856-9f6e-82cfa83802f6	816a28f7-3d0b-430f-ae26-97b3bfe5a674	2025-11-16 16:06:43.46
bd0d9624-a0fe-4314-b731-9fa178f8bd44	467661e1-c998-4856-9f6e-82cfa83802f6	84d090aa-8a06-4c90-a836-51af4f858f24	2025-11-16 16:06:43.46
e997cfaa-ecd8-4b8c-88a0-3ece835c0875	467661e1-c998-4856-9f6e-82cfa83802f6	00ac2c26-fe45-4d1d-9ac2-6c9a7faea286	2025-11-16 16:06:43.46
aa559bb7-1b99-4d3f-8c9b-2ab5524f2736	17149290-e755-4306-8b69-44a6e1fda70b	84d090aa-8a06-4c90-a836-51af4f858f24	2025-11-16 16:06:43.46
f95b91fd-6597-4788-8123-2ef2ca140adb	17149290-e755-4306-8b69-44a6e1fda70b	00ac2c26-fe45-4d1d-9ac2-6c9a7faea286	2025-11-16 16:06:43.46
4fb1e89d-fbf2-4d0b-8ab4-81e9fe292df1	69eacf97-c138-4e82-bed0-66fa3752d78a	7cd8387b-4714-4b07-b52e-067252a1f5ea	2025-11-16 16:06:43.46
22dae2e1-0210-41d8-9edd-ada7469f031e	17149290-e755-4306-8b69-44a6e1fda70b	7cd8387b-4714-4b07-b52e-067252a1f5ea	2025-11-16 16:06:43.46
17a357df-2592-4577-821e-6fc01b4e8f22	17149290-e755-4306-8b69-44a6e1fda70b	a533486f-767d-4110-aaee-a4d85c5fd5de	2026-01-16 15:43:29.026
18dbc2ab-cd21-4b4e-879f-02380d852753	17149290-e755-4306-8b69-44a6e1fda70b	ed70d185-38b4-4eeb-9acf-0d060461f69f	2026-01-17 05:29:59.442
\.


--
-- Data for Name: MediaFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MediaFile" (id, url, "publicId", name, size, type, "mimeType", "thumbnailUrl", width, height, duration, "threadId", "replyId", "createdAt") FROM stdin;
deb4f97c-0485-4944-8931-bee091c29f1b	https://res.cloudinary.com/ddzprakot/image/upload/v1757160522/mirchanForumMedia/b/xnrw07xzxh46pxck6xoo.jpg	mirchanForumMedia/b/xnrw07xzxh46pxck6xoo	20250825_1253_Minimalist M Logo_simple_compose_01k3g3e6ntfxbs14e0snb9ph9b.png	1652114	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757160522/mirchanForumMedia/b/xnrw07xzxh46pxck6xoo.jpg	1024	1536	\N	f92267b9-f68e-4dbe-8663-194195fe5bc6	\N	2025-09-06 12:08:45.284
0d775795-3eb7-46a3-bb33-3e5a2cb72058	https://res.cloudinary.com/ddzprakot/image/upload/v1757160521/mirchanForumMedia/b/tfxkaqeanqxnpvrcfvvj.jpg	mirchanForumMedia/b/tfxkaqeanqxnpvrcfvvj	ChatGPT Image 13 Ð¸ÑÐ». 2025 Ð³., 15_58_25.png	1325959	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757160521/mirchanForumMedia/b/tfxkaqeanqxnpvrcfvvj.jpg	1024	1024	\N	f92267b9-f68e-4dbe-8663-194195fe5bc6	\N	2025-09-06 12:08:45.284
479925e7-6108-4ac6-b5f2-cfe272dcfa04	https://res.cloudinary.com/ddzprakot/image/upload/v1757168394/mirchanForumMedia/b/r7no17rq4ziirahkjkfl.jpg	mirchanForumMedia/b/r7no17rq4ziirahkjkfl	20250825_1253_Minimalist M Logo_simple_compose_01k3g3e6ntfxbs14e0snb9ph9b.png	1652114	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757168394/mirchanForumMedia/b/r7no17rq4ziirahkjkfl.jpg	1024	1536	\N	\N	251aa049-dacf-4dab-9d2f-3bc7ee624c5f	2025-09-06 14:19:56.493
8e644d4c-a8b7-42b5-bc41-4cb317368f9b	https://res.cloudinary.com/ddzprakot/image/upload/v1757168389/mirchanForumMedia/b/p3ohadawunlugjawzgah.jpg	mirchanForumMedia/b/p3ohadawunlugjawzgah	050a2c0382eca6c0e1af5b14f8d0f71b.jpg	13268	image	image/jpeg	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757168389/mirchanForumMedia/b/p3ohadawunlugjawzgah.jpg	280	280	\N	\N	251aa049-dacf-4dab-9d2f-3bc7ee624c5f	2025-09-06 14:19:56.493
bdee6bba-748e-445f-b29f-84c55338bc9c	https://res.cloudinary.com/ddzprakot/image/upload/v1757168390/mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel.png	mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel	59330.png	79731	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757168390/mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel.png	192	192	\N	\N	251aa049-dacf-4dab-9d2f-3bc7ee624c5f	2025-09-06 14:19:56.493
e1c13323-a5a1-4bcb-b306-cf5527ac925c	https://res.cloudinary.com/ddzprakot/image/upload/v1757168393/mirchanForumMedia/b/nzccizbeihk76cloemy2.jpg	mirchanForumMedia/b/nzccizbeihk76cloemy2	20250825_1247_ÐÐ¾Ð³Ð¾ÑÐ¸Ð¿ Ð´Ð»Ñ Mirchan_simple_compose_01k3g319mnfs0bpdx7zgwaew6a.png	1716340	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757168393/mirchanForumMedia/b/nzccizbeihk76cloemy2.jpg	1024	1536	\N	\N	251aa049-dacf-4dab-9d2f-3bc7ee624c5f	2025-09-06 14:19:56.493
59ab2965-113d-4c3a-bc87-e647f69cf012	https://res.cloudinary.com/ddzprakot/image/upload/v1757683166/mirchanForumMedia/b/cz8bawbobctzqzlymz8s.jpg	mirchanForumMedia/b/cz8bawbobctzqzlymz8s	20250825_1247_ÐÐ¾Ð³Ð¾ÑÐ¸Ð¿ Ð´Ð»Ñ Mirchan_simple_compose_01k3g319mpe518s22j73egc7dh.png	2003513	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757683166/mirchanForumMedia/b/cz8bawbobctzqzlymz8s.jpg	1024	1536	\N	28b4356b-9cc6-4b02-b359-540c5e956ac8	\N	2025-09-12 13:19:28.265
654a4900-75fb-432c-8af7-16b6aa61f81e	https://res.cloudinary.com/ddzprakot/image/upload/v1757746819/mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh.jpg	mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh	BeFunky-collage-(7)1732879024-0-412x290.webp	15852	image	image/webp	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757746819/mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh.jpg	412	290	\N	219d8061-c916-4b83-89be-34470bb4d8b4	\N	2025-09-13 07:00:19.774
26c5812e-c839-4d32-99fd-6921d03c94b2	https://res.cloudinary.com/ddzprakot/image/upload/v1757758296/mirchanForumMedia/a/dat02lryk1pfdpsdeuuq.jpg	mirchanForumMedia/a/dat02lryk1pfdpsdeuuq	2048x1152-pixel-kdrdqj155uykpy6d.jpg	78772	image	image/jpeg	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757758296/mirchanForumMedia/a/dat02lryk1pfdpsdeuuq.jpg	1920	1080	\N	26749e30-a600-4ba0-aa96-c897b6cfdebe	\N	2025-09-13 10:11:37.939
5199f4fc-5f42-4fe9-b9d7-c8c492e433a5	https://res.cloudinary.com/ddzprakot/image/upload/v1767623612/forum/a/1767623605923_20251203_02h40m10s_grim.png.png	forum/a/1767623605923_20251203_02h40m10s_grim.png	\N	711708	image	image/png	https://res.cloudinary.com/ddzprakot/image/upload/v1767623612/forum/a/1767623605923_20251203_02h40m10s_grim.png.png	\N	\N	\N	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	\N	2026-01-05 14:33:33.245
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, content, "senderId", "chatId", "isRead", "createdAt") FROM stdin;
e44f6630-2be0-4878-b917-2421776a1bfb	Ого фон из раста	207b302d-6504-4e0a-be43-5831cba49e2a	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-04 17:58:20.356
ca10f751-47c0-4c1b-bf1b-58e72adbaeb0	ага, нужно как то все фоны спарсить	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-05 07:46:11.628
097feecc-2dfd-4ece-87da-7804d09a2a7c	А как ты это делаешь в целом	207b302d-6504-4e0a-be43-5831cba49e2a	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-05 12:28:02.212
4e994e0e-614d-4747-b79d-674cde3bb2a2	просто беру ссылки на видео с сайта	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-05 13:29:48.195
400f3c63-995d-4111-bacd-b2330aa920bd	то есть эти видео не хранятся у меня на сервере, а в том сайте который я скидывал в группе	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-05 13:30:47.101
b146a932-2e1d-4b0a-869d-2eb570c1adea	тут просто вывожу их	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-05 13:31:13.005
5d7bec46-5461-4507-ad5c-ae03a733d3f0	На мобил версии плюсик. Втредах перекрывает иконку своего акка в нижнем меню. А ещё как админить треды?	207b302d-6504-4e0a-be43-5831cba49e2a	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-06 21:06:11.757
7d609816-a284-4205-b04c-cd712754d0e6	понял спасибо	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-07 08:53:37.176
02695a5b-ecd5-4ad8-83f6-1022ac3a2bed	все админится в админке	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	t	2025-09-07 08:53:52.005
b0fb0364-0a62-45c9-95e5-be679867473d	привет	17149290-e755-4306-8b69-44a6e1fda70b	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	t	2025-11-12 10:01:30.61
38a7422c-7675-4f3f-a1e4-9e96c0d92731	privet	467661e1-c998-4856-9f6e-82cfa83802f6	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	t	2025-11-12 10:01:46.294
7cbbd367-36e4-492e-8cd3-d4e152ba0252	че как	17149290-e755-4306-8b69-44a6e1fda70b	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	f	2025-11-12 10:02:12.903
5c2e731f-dccb-433f-8006-2e77168cae79	ало	17149290-e755-4306-8b69-44a6e1fda70b	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	f	2025-11-12 10:02:13.908
aed94d65-2a57-4aa1-98b3-2dbbe0e0578f	рас рас	17149290-e755-4306-8b69-44a6e1fda70b	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	f	2025-11-12 10:02:15.337
d50bc20c-9730-4528-a6df-b7823479248a	hello world	17149290-e755-4306-8b69-44a6e1fda70b	8cba88db-5bd2-46e1-8c9f-40ce99ec457c	f	2025-11-14 15:44:59.866
2f49cdbb-69b7-4412-98bd-8a086693f240	привет	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:47:05.488
26399c43-9b42-45a3-a599-081e95e386c8	как дела?	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:47:09.733
0cc6b3b5-7837-440c-8804-8a989906ebf9	привет	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:54:29.023
feafc5c4-5034-472f-8d9a-8577d8f58487	првиет	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:54:43.418
6e38bbc3-f1b7-4000-8019-c84bcae04a8d	как дела?	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:54:49.247
41079b91-e889-4eac-98e7-7d2875631b13	че далаешь?	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:54:53.261
66a0cc54-2a9b-4841-891b-babff96a2446	да норм	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:55:01.234
5c566efe-73ab-47fb-a965-4e37f0ea7af7	понял	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:55:05.756
3a122782-aeb5-4ac0-9f66-03dd64d64e67	ок	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:55:21.427
360899c8-e209-468b-882a-1a55ab478dbd	ясно	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:55:46.39
467a9236-e144-4953-985d-64f0b58f15f0	привет	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:57:26.118
f12bc3b7-d06d-4ccb-aced-497866ee32f5	как дела?	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:57:29.695
6d662d9a-33c9-4c7d-831f-cd5434445b39	пойдет	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:57:34.24
a30c32ee-fed5-4670-a41b-ab6b864e6ef3	ок?	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:57:41.415
d9689c4c-a1fc-4e44-a2dd-f920642e3b4c	хахахах	69eacf97-c138-4e82-bed0-66fa3752d78a	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 15:57:44.697
e4420509-f470-4d0c-a769-3d2b30f29a42	привет	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 18:00:13.037
37bb3609-6c58-45d6-87c3-78e3a25dadd2	hii	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 19:01:25.95
45c96205-14b9-48ea-900c-4b589f4793a9	как дела?	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 19:08:30.259
5a973586-e014-46d0-b58d-d8f6a232b0a7	хай	17149290-e755-4306-8b69-44a6e1fda70b	e8e016c9-2c51-4a44-bb4e-90ca8f5bb919	t	2025-11-14 19:49:58.474
ecfa22ae-c8c5-4f6f-8562-ae921deeda39	привет	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	f	2025-12-22 21:12:54.956
a5a1332a-5020-4b4d-bbb3-0b7b20545b78	hello world	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	f	2025-12-22 21:20:37.014
5c12600e-d481-4ca9-9c6c-79eb7191efdb	надеюсь работает	17149290-e755-4306-8b69-44a6e1fda70b	c2e96187-759f-4656-8092-b348acdc6363	f	2025-12-22 22:03:11.191
\.


--
-- Data for Name: ModAction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ModAction" (id, "moderatorId", action, "targetType", "targetId", reason, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: Notice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notice" (id, "userId", content, "createdAt", "expiredAt", active, type, title, "emojiUrl") FROM stdin;
0515f42b-0b5e-4eca-93b2-d8ef25c54bf9	17149290-e755-4306-8b69-44a6e1fda70b	Форум находится на стадии разработки!	2026-01-04 20:35:21.889	2026-02-03 20:35:21.888	t	warning	Внимание	\N
14d3ace7-8565-4ecc-a483-7fd17fa654f9	17149290-e755-4306-8b69-44a6e1fda70b	и желает чтобы все лучшее и прекрасное случилось в новом 2026 году. Пусть грядущие 12 месяцев принесут вам яркие идеи, новые знакомства и моменты, которые хочется запомнить.\n✨ С праздником и до встречи в новом году!	2026-01-04 20:38:27.231	2026-01-30 20:38:27.23	t	default	Команда Mirchan поздравляет вас с Новым годом	\N
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Post" (id, content, "imageUrl", "emojiUrls", "authorId", "createdAt", views) FROM stdin;
a533486f-767d-4110-aaee-a4d85c5fd5de	бд очистилась [emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866742/vikostvspack_agadvjiaalt9keo_AgADvjIAAlt9kEo_small_fbrgyu.gif}	e5fbff75-13b4-4121-9fb7-d320c58c6234	2025-09-02 16:27:46.304	{17149290-e755-4306-8b69-44a6e1fda70b,207b302d-6504-4e0a-be43-5831cba49e2a,5121eb10-106d-4d32-8e0c-ddcc4dadaca9}
88095831-5008-49a0-ba18-9d126f392af3	ничего нового нет, кроме гугл авторизации [emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-09-03 20:06:01.938	{207b302d-6504-4e0a-be43-5831cba49e2a,e5fbff75-13b4-4121-9fb7-d320c58c6234,3b36f689-02fd-4958-a8b7-98f83b1d6770,5121eb10-106d-4d32-8e0c-ddcc4dadaca9}
74d8810b-1e76-4e97-b6d2-2418b12bb376	Пипяу[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866725/vikostvspack_agaddhmaaojekuk_AgADDHMAAoJeKUk_small_wmktvu.gif}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-09-03 20:44:22.071	{17149290-e755-4306-8b69-44a6e1fda70b,e5fbff75-13b4-4121-9fb7-d320c58c6234,3b36f689-02fd-4958-a8b7-98f83b1d6770,5121eb10-106d-4d32-8e0c-ddcc4dadaca9}
1669c8a1-782e-4c95-9d5d-0578f5bfdbed	Малиновая лада, малиновый закат\r\n	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-09-04 18:02:15.47	{e5fbff75-13b4-4121-9fb7-d320c58c6234,17149290-e755-4306-8b69-44a6e1fda70b,3b36f689-02fd-4958-a8b7-98f83b1d6770,5121eb10-106d-4d32-8e0c-ddcc4dadaca9}
4921a630-1bfd-4604-b451-f79926da6eca	ну как так, мирчан все съедает[emoji:0]	https://res.cloudinary.com/ddzprakot/image/upload/v1757060874/mirchanPost/gk0odh5vdtskj6dl6jhb.png	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866723/vikostvspack_agad2zmaakpyuuo_AgAD2zMAAkPYUUo_small_scsfzv.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-09-05 08:27:54.95	{207b302d-6504-4e0a-be43-5831cba49e2a,3b36f689-02fd-4958-a8b7-98f83b1d6770,5121eb10-106d-4d32-8e0c-ddcc4dadaca9}
49addcbe-3e05-409d-a740-3c570db2a6ae	А че нас всего двое? Я, ты, твой тестовый акк и официал мирчан[emoji:0]? 	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866725/vikostvspack_agaddhmaaojekuk_AgADDHMAAoJeKUk_small_wmktvu.gif}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-09-08 11:01:29.761	{3b36f689-02fd-4958-a8b7-98f83b1d6770,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,17149290-e755-4306-8b69-44a6e1fda70b}
7922b02f-4261-4b77-b2ea-a96f046a6b13	Осталось добавить статус в профиль для цитаток	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-09-08 20:43:16.434	{5121eb10-106d-4d32-8e0c-ddcc4dadaca9,17149290-e755-4306-8b69-44a6e1fda70b,e8169a04-f6ca-44a2-96b2-ea310d0d389c}
ce231dab-c838-4356-a90f-54bb7304fd8a	Вечер в хату, уважаемые	\N	{}	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-09-08 20:50:20.553	{17149290-e755-4306-8b69-44a6e1fda70b,e8169a04-f6ca-44a2-96b2-ea310d0d389c,207b302d-6504-4e0a-be43-5831cba49e2a}
df05f48f-d055-4b97-b433-609ee10703a8	ㅤ	https://res.cloudinary.com/ddzprakot/image/upload/v1757364708/mirchanPost/cmgwczcogikyc21jfxvc.jpg	{}	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-09-08 20:51:48.893	{17149290-e755-4306-8b69-44a6e1fda70b,e8169a04-f6ca-44a2-96b2-ea310d0d389c,207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a}
1e01994e-1828-4bfb-b8c5-baa9c2c2929f	Фулл ищите на тëмной стороне стима	https://res.cloudinary.com/ddzprakot/image/upload/v1757364739/mirchanPost/fb6kft3kvbgvnv7jxp3x.jpg	{}	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-09-08 20:52:20.049	{17149290-e755-4306-8b69-44a6e1fda70b,e8169a04-f6ca-44a2-96b2-ea310d0d389c,7c5dd46f-7a4e-4bc2-8aeb-7349c584c513,207b302d-6504-4e0a-be43-5831cba49e2a}
f4eb1e43-5510-4e1b-a925-34c36149959d	Так то прикольно 	\N	{}	e8169a04-f6ca-44a2-96b2-ea310d0d389c	2025-09-13 13:24:12.162	{17149290-e755-4306-8b69-44a6e1fda70b,7c5dd46f-7a4e-4bc2-8aeb-7349c584c513,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a}
d1a5977f-90b0-432b-a9b0-415feea70197	много чего еще нужно реализовать. думаю на очереди пуш уведомления	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-09-13 13:47:37.21	{7c5dd46f-7a4e-4bc2-8aeb-7349c584c513,f9ca604e-926e-4316-b61b-e8c07dd512af,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,207b302d-6504-4e0a-be43-5831cba49e2a}
f8fb932e-e4df-47be-808e-fd87bf6d0074	Отлично [emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif}	7c5dd46f-7a4e-4bc2-8aeb-7349c584c513	2025-09-15 12:49:38.515	{17149290-e755-4306-8b69-44a6e1fda70b,f9ca604e-926e-4316-b61b-e8c07dd512af,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a}
9f28dea8-5415-47f7-8efa-d10cb0e1a7b7	@☠༆ᴺᵉˣᵘˢᏃᎬᎡϴ༒ c др	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-09-28 20:40:19.52	{17149290-e755-4306-8b69-44a6e1fda70b,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,69eacf97-c138-4e82-bed0-66fa3752d78a}
789df1d0-c02f-4daa-b236-5b2e05d6f6d3	[mention:68b8a864f2af14c35864dca5|Neivo]	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-01 10:29:50.448	{207b302d-6504-4e0a-be43-5831cba49e2a,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,69eacf97-c138-4e82-bed0-66fa3752d78a}
969bb712-8f8c-4af2-80a2-9b855ca2b745	[mention:68bf3f317cbe6f542cef36f6|☠༆ᴺᵉˣᵘˢᏃᎬᎡϴ༒]\n[mention:68b8a864f2af14c35864dca5|Neivo] \nготово, все работает	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-01 10:30:30.678	{207b302d-6504-4e0a-be43-5831cba49e2a,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,194ba6ea-72a4-4272-9a3d-5fce2f1483e7,69eacf97-c138-4e82-bed0-66fa3752d78a}
3015d562-62cf-4e90-ae92-79003cc08533	[mention:68bf3f317cbe6f542cef36f6|☠༆ᴺᵉˣᵘˢᏃᎬᎡϴ༒] pon	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-10-01 19:49:39.371	{17149290-e755-4306-8b69-44a6e1fda70b,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,194ba6ea-72a4-4272-9a3d-5fce2f1483e7,69eacf97-c138-4e82-bed0-66fa3752d78a}
dc405dc4-aa3a-48b2-9f18-cc0c13f8a01c	[mention:68b8a864f2af14c35864dca5|Neivo]	\N	{}	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-10-05 18:03:39.523	{17149290-e755-4306-8b69-44a6e1fda70b,207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a}
d25f2626-fd4d-4d1d-b578-b068672b2a67	next update: \r\n1)text markdown \r\n2) thread card improvement\r\n3) notification\r\n....	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-16 19:34:46.391	{}
92fa4fdb-c122-442a-9373-b4d52a55e1e1	всем привет [emoji:0][emoji:1]	https://res.cloudinary.com/ddzprakot/image/upload/v1759695148/mirchanPost/rscugwmnhb6ttespqqxw.png	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif,https://res.cloudinary.com/ddzprakot/image/upload/v1755866736/vikostvspack_agadnu4aauu8-es_AgADnU4AAuu8-Es_small_nsptgz.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-05 20:12:30.515	{207b302d-6504-4e0a-be43-5831cba49e2a,194ba6ea-72a4-4272-9a3d-5fce2f1483e7,e5fbff75-13b4-4121-9fb7-d320c58c6234,5121eb10-106d-4d32-8e0c-ddcc4dadaca9,69eacf97-c138-4e82-bed0-66fa3752d78a}
cc0c5452-2d68-47f9-af07-cd556fb3812f	всем привет как дела [mention:68b8a864f2af14c35864dca5|Neivo] это тестовое сообщение [emoji:4]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif,https://res.cloudinary.com/ddzprakot/image/upload/v1755866748/vikostvspack_agadyfeaarjq-es_AgADyFEAArJq-Es_small_qkg0yu.gif,https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif,https://res.cloudinary.com/ddzprakot/image/upload/v1755866750/vikostvspack_agaeyaacuz05sw_AgAEYAACuZ05Sw_small_uie6cz.gif,https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-16 18:58:51.178	{5121eb10-106d-4d32-8e0c-ddcc4dadaca9,207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a}
7151204d-5837-4a24-9f61-ecdcfe1ea298	https://www.yyyyyyy.info/	\N	{}	5121eb10-106d-4d32-8e0c-ddcc4dadaca9	2025-10-18 12:07:12.252	{17149290-e755-4306-8b69-44a6e1fda70b,207b302d-6504-4e0a-be43-5831cba49e2a,0d3f42f8-05e4-4728-8c5b-31665000b834,69eacf97-c138-4e82-bed0-66fa3752d78a}
58ef67c1-3634-419a-8a5d-d1390cf06690	Ave Maria\r\n	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-10-20 11:01:34.639	{17149290-e755-4306-8b69-44a6e1fda70b,0d3f42f8-05e4-4728-8c5b-31665000b834,69eacf97-c138-4e82-bed0-66fa3752d78a}
369bda6a-e590-4aab-95d8-055cda8e9084	ntr	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-30 13:27:16.808	{207b302d-6504-4e0a-be43-5831cba49e2a,0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6,69eacf97-c138-4e82-bed0-66fa3752d78a}
816a28f7-3d0b-430f-ae26-97b3bfe5a674	tanstak query migrate: test\r\n	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-10-30 13:27:48.002	{207b302d-6504-4e0a-be43-5831cba49e2a,0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6,69eacf97-c138-4e82-bed0-66fa3752d78a}
eae191c3-ec43-44e6-b00e-a8b3df3d65f6	привет тест 	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-05 09:40:58.9	{207b302d-6504-4e0a-be43-5831cba49e2a,69eacf97-c138-4e82-bed0-66fa3752d78a,0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6}
dc878954-fae6-4519-aeff-a94f0e3c8021	Плыли мы по морю ветер мачту рвал\r\n	\N	{}	207b302d-6504-4e0a-be43-5831cba49e2a	2025-11-08 18:21:08.134	{17149290-e755-4306-8b69-44a6e1fda70b,69eacf97-c138-4e82-bed0-66fa3752d78a,0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6}
7a152f33-0f01-4232-ac14-fe06329ffcb3	test[emoji:0]	https://res.cloudinary.com/ddzprakot/image/upload/v1762698578/mirchanPost/enonzokglngr6e4ticbk.jpg	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866749/vikostvspack_agadyfyaaor42es_AgADyFYAAor42Es_small_ufh0rf.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-09 14:29:39.038	{0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6}
f96da602-ccfa-40f2-9781-86702b9058e4	скоро выпущу небольшую обнову.	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-09 14:41:42.712	{0d3f42f8-05e4-4728-8c5b-31665000b834,467661e1-c998-4856-9f6e-82cfa83802f6}
00ac2c26-fe45-4d1d-9ac2-6c9a7faea286	ух ты[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866725/vikostvspack_agaddhmaaojekuk_AgADDHMAAoJeKUk_small_wmktvu.gif}	0d3f42f8-05e4-4728-8c5b-31665000b834	2025-11-12 09:09:11.461	{467661e1-c998-4856-9f6e-82cfa83802f6,17149290-e755-4306-8b69-44a6e1fda70b,69eacf97-c138-4e82-bed0-66fa3752d78a}
84d090aa-8a06-4c90-a836-51af4f858f24	чуваак[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866735/vikostvspack_agadndwaavuqieo_AgADNDwAAvuqIEo_small_rq9x3p.gif}	467661e1-c998-4856-9f6e-82cfa83802f6	2025-11-12 09:41:02.076	{17149290-e755-4306-8b69-44a6e1fda70b,69eacf97-c138-4e82-bed0-66fa3752d78a}
78878e28-0465-44aa-a80e-2de2337ab93f	прощайте долгие загрузки данных[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866735/vikostvspack_agadmxeaareloug_AgADmXEAArEloUg_small_rp2c1m.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-14 20:11:08.189	{69eacf97-c138-4e82-bed0-66fa3752d78a}
7cd8387b-4714-4b07-b52e-067252a1f5ea	интересно	\N	{}	69eacf97-c138-4e82-bed0-66fa3752d78a	2025-11-14 20:25:45.897	{17149290-e755-4306-8b69-44a6e1fda70b}
f919be3d-1b8b-4bf2-bd12-804e8c15149d	првиет	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2025-11-16 15:05:31.04	{}
7e820e85-2232-437c-bb1b-733c8aa09e62	с новым годом[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866735/vikostvspack_agadndwaavuqieo_AgADNDwAAvuqIEo_small_rq9x3p.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2025-12-30 19:10:53.551	{}
d03c3832-d462-489c-a4b3-4e0063f61cee	чуток выгорел от этого проекта 	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-04 10:25:26.297	{}
8be5aa2f-3f37-4ef6-9894-0559150dd01f	все пропали	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-16 10:15:00.369	{}
ef688cac-0b83-48f5-a951-41b82cf4ce01	.	\N	{}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-16 19:34:16.529	{}
ed70d185-38b4-4eeb-9acf-0d060461f69f	mirchan --version  2.1.3 [emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866735/vikostvspack_agadndwaavuqieo_AgADNDwAAvuqIEo_small_rq9x3p.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-16 19:37:08.134	{}
5dbbfa7f-9d13-4c9c-90c0-b8504ab0b060	не успел[emoji:0]	\N	{https://res.cloudinary.com/ddzprakot/image/upload/v1755866742/vikostvspack_agadvjiaalt9keo_AgADvjIAAlt9kEo_small_fbrgyu.gif}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-25 15:57:14.358	{}
cf91d9f0-2b0d-4ed7-99e6-dcc17b1e6d7d	\r\n тест\r\n	https://res.cloudinary.com/ddzprakot/image/upload/v1768659837/mirchanPost/post_17149290-e755-4306-8b69-44a6e1fda70b_1768659833825.png	{}	17149290-e755-4306-8b69-44a6e1fda70b	2026-01-17 14:23:59.144	{}
\.


--
-- Data for Name: Reply; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reply" (id, "shortId", "threadId", content, "authorName", "authorTrip", "posterHash", "postNumber", "imageCount", "imageUrl", "imagePublicId", "imageName", "imageSize", "thumbnailUrl", "replyTo", "quotedBy", "isDeleted", "deletedAt", "createdAt") FROM stdin;
b9b18897-379d-4180-a839-83e8faddb39c	85f4j0	b18acc11-9650-4dd6-83cf-45ecfb2e5f47	так это тестовый ответ 	вавыаы	\N	db570a46	2	0	https://res.cloudinary.com/ddzprakot/image/upload/v1757018971/mirchanForumMedia/a/li5vgczy2aleqhhiy5gs.jpg	mirchanForumMedia/a/li5vgczy2aleqhhiy5gs	photo_2025-06-01_16-49-59.jpg	34322	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757018971/mirchanForumMedia/a/li5vgczy2aleqhhiy5gs.jpg	{}	{}	f	\N	2025-09-04 20:49:33.364
f2c31ae6-239b-46f4-b2a8-e216a9539278	0l8sxi	59cd9b77-84bc-4307-807e-6a57eff803ee	приетт	Аноним	\N	72a5058a	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-05 07:53:53.074
edd5e37e-19bb-4d54-a1a4-f9b6220e09de	z0898p	59cd9b77-84bc-4307-807e-6a57eff803ee	твосв\r\n	Аноним	\N	72a5058a	3	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-05 07:54:10.903
215b5b5d-ecff-4c0f-bdbe-6204039ea15c	je0qab	59cd9b77-84bc-4307-807e-6a57eff803ee	qwe	Аноним	\N	72a5058a	4	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-05 07:54:24.74
905ea0a9-095b-4d05-ad89-36acfab8ea3e	xb0zz8	2ab69cde-1151-4f5f-985e-ce0cdc7e33cf	jajajaja	Аноним	\N	7a5f7fa2	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-05 07:59:17.578
63103f59-ee65-4d85-92a8-50024b7fffa7	rwe1vs	59cd9b77-84bc-4307-807e-6a57eff803ee	test	Аноним	\N	94d6ae4c	5	0	https://res.cloudinary.com/ddzprakot/video/upload/v1757064212/mirchanForumMedia/b/ao5gsawrukjkwbs3kk16.mp4	mirchanForumMedia/b/ao5gsawrukjkwbs3kk16	610691463_847f25d7-fc17-4f43-8172-de4e80a9e033_Instagram.mp4	2297438	\N	{}	{}	f	\N	2025-09-05 09:23:38.828
82fcbe4a-b6ac-41be-a097-f1052c46dd6b	cgz51b	59cd9b77-84bc-4307-807e-6a57eff803ee	test	Аноним	\N	94d6ae4c	6	0	https://res.cloudinary.com/ddzprakot/video/upload/v1757064615/mirchanForumMedia/b/plkak8bmliffdk07dw9k.webm	mirchanForumMedia/b/plkak8bmliffdk07dw9k	ÐÐ°Ð¿Ð¸ÑÑ ÑÐºÑÐ°Ð½Ð° Ð¾Ñ 2025-07-27 08-39-16.webm	623144	\N	{}	{}	f	\N	2025-09-05 09:30:31.572
e6c022b5-caaf-4f56-aaea-50633e710625	672qs5	59cd9b77-84bc-4307-807e-6a57eff803ee	>>3 ntrt	Аноним	\N	ad419bdc	7	0	\N	\N	\N	\N	\N	{z0898p}	{}	f	\N	2025-09-05 10:37:00.6
e67ff893-06fd-4951-9896-11c3d2e2f2a4	3yha0a	59cd9b77-84bc-4307-807e-6a57eff803ee	>>68ba97117d25fadeeb3b99bd\r\nтекст	Аноним	\N	b14ec695	8	0	\N	\N	\N	\N	\N	{0l8sxi}	{}	f	\N	2025-09-05 10:49:32.772
135b7188-9a5b-411e-be73-b26cef455715	73z2q3	59cd9b77-84bc-4307-807e-6a57eff803ee	>>672qs5 \r\nntcn\r\n	Аноним	\N	4396ec89	9	0	\N	\N	\N	\N	\N	{672qs5}	{}	f	\N	2025-09-05 11:18:53.101
452a2041-bc19-4cd2-aa40-080956ebd918	ekrot3	59cd9b77-84bc-4307-807e-6a57eff803ee	авомтромтв	Аноним	\N	4396ec89	10	0	\N	\N	\N	\N	\N	{0l8sxi}	{}	f	\N	2025-09-05 11:20:56.316
01fb6f5c-063b-41ae-b486-5ee790142480	qzr69d	59cd9b77-84bc-4307-807e-6a57eff803ee	>>cgz51b\r\nываьдлвыаыа	Аноним	\N	4396ec89	11	0	\N	\N	\N	\N	\N	{cgz51b}	{}	f	\N	2025-09-05 11:23:17.36
af42581f-2615-430d-8da5-443b899eb104	4ht488	59cd9b77-84bc-4307-807e-6a57eff803ee	I got bitches	Аноним	\N	d7b7931e	12	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-05 18:34:30.507
7b47f233-c4e8-41dc-a378-c1888b422ed7	ue60pk	b18acc11-9650-4dd6-83cf-45ecfb2e5f47	test	Аноним	\N	d2511550	3	0	https://res.cloudinary.com/ddzprakot/image/upload/v1757140863/mirchanForumMedia/a/ahcszhmaviqwmmianivq.png	mirchanForumMedia/a/ahcszhmaviqwmmianivq	Adobe Express - file.png	85779	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757140863/mirchanForumMedia/a/ahcszhmaviqwmmianivq.png	{}	{}	f	\N	2025-09-06 06:41:05.645
251aa049-dacf-4dab-9d2f-3bc7ee624c5f	md2zhp	f92267b9-f68e-4dbe-8663-194195fe5bc6	more media content 	Аноним	\N	1abf1a04	2	4	https://res.cloudinary.com/ddzprakot/image/upload/v1757168390/mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel.png	mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel	59330.png	79731	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757168390/mirchanForumMedia/b/ldmwlqmpkjfxzfiamvel.png	{}	{}	f	\N	2025-09-06 14:19:56.493
581f0143-b6e1-4d31-85a8-f3443789f83b	b2t6xn	f92267b9-f68e-4dbe-8663-194195fe5bc6	>>md2zhp\r\nответ на пост	Аноним	\N	1abf1a04	3	0	\N	\N	\N	\N	\N	{md2zhp}	{}	f	\N	2025-09-06 14:21:15.253
3bc1cbe3-c0f2-4542-8732-9404e9a9279f	0agp19	59cd9b77-84bc-4307-807e-6a57eff803ee	Итого самый популярный тред это 18+	Антон без т	\N	f3ac57c9	13	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-08 11:08:17.315
b99c0524-547d-49a1-9c8e-d390af468e72	umjpwd	219d8061-c916-4b83-89be-34470bb4d8b4	мой первый ответ\r\n	Аноним	\N	59dcb652	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 09:40:17.747
8e4985d0-597a-4f9b-bea1-1bfbf3b15a5f	117vrj	b18acc11-9650-4dd6-83cf-45ecfb2e5f47	тест\r\n\r\n	Аноним	\N	59dcb652	4	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 09:41:03.822
cabfb792-1e44-4c39-be13-387b2a6cf933	ykcxks	94b4e71e-97f5-4b33-99cd-87d9610ed9f9	привет 	Аноним	\N	e3b709ed	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 09:55:10.14
d805ee3d-25e3-4479-a6a3-7f93b6f4d44e	bbfdai	94b4e71e-97f5-4b33-99cd-87d9610ed9f9	тест\r\n	Аноним	\N	e3b709ed	3	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 09:55:22.593
9c205ac4-bc9d-4738-891e-19157e04a15e	kwarpf	2ab69cde-1151-4f5f-985e-ce0cdc7e33cf	тест отвостыв\r\n	Аноним	\N	e97472d3	3	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 09:56:35.258
dc06a121-6d95-461e-8134-1cae3072cf4d	58fpht	59cd9b77-84bc-4307-807e-6a57eff803ee	ntcnjdskmcs	Аноним	\N	c9257b1c	14	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 10:08:06.392
b44d6cd2-8ef7-4f27-bc30-39c51fcfaa1a	zcjyo8	26749e30-a600-4ba0-aa96-c897b6cfdebe	тестовый ответ тик ток	test	\N	23c0f9a6	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 10:12:21.749
5a405779-d5d2-41d5-8827-b8511f36f3b7	2ub33j	219d8061-c916-4b83-89be-34470bb4d8b4	ткскт	Аноним	\N	b812dc8d	3	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 13:11:30.25
68073079-4012-4318-9c21-4ba594437421	q7w3z1	219d8061-c916-4b83-89be-34470bb4d8b4	Ш - общительная	Аноним	\N	b812dc8d	4	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-09-13 13:12:33.417
f0421f70-b31d-4398-999f-146f85af3e8e	a3stnj	219d8061-c916-4b83-89be-34470bb4d8b4	привет 	Аноним	\N	422451f9	5	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2025-11-12 09:57:39.271
7fc1985b-1faa-4760-9706-bf7881705484	58070c58	219d8061-c916-4b83-89be-34470bb4d8b4	тест	Аноним	\N	a4726e4c	6	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2026-01-05 14:30:44.044
1948988d-0fbb-4188-9462-349da903650e	0def0edb	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	привет\r\n	Аноним	\N	e2eb368f	2	0	\N	\N	\N	\N	\N	{}	{}	f	\N	2026-01-05 14:44:07.82
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tag" (id, name, slug, icon, color, description, "createdAt") FROM stdin;
5a80e77a-17dc-48f5-adfd-bc243ebdeb2b	Youtube	youtube	https://res.cloudinary.com/ddzprakot/image/upload/v1757684384/mirchanForumMedia/categories/ikv4mf3igydztekb9hz2.png	#AE2029	тег ютуба	2025-09-12 13:39:45.288
7dd0fcef-86f5-4417-9fd7-b1e68786c7f4	Instagram	instagram	https://res.cloudinary.com/ddzprakot/image/upload/v1757746292/mirchanForumMedia/categories/khpspeoycalwpgd9ju2w.png	\N	Тег для инстаграма 	2025-09-13 06:51:35.379
32102b20-eb35-4363-a9d0-1f5d567d949e	OnlyFans	onlyfans	https://res.cloudinary.com/ddzprakot/image/upload/v1757766281/mirchanForumMedia/categories/zieo5xnopl00c9howgof.jpg	#00aff2	onlyfans tag	2025-09-13 12:24:43.021
245a0ce2-5664-44fc-8276-f861704e409d	Reddit	reddit	https://res.cloudinary.com/ddzprakot/image/upload/v1757766431/mirchanForumMedia/categories/iru7vn6f741yeqtr0vso.png	#ff4b08	reddit tag	2025-09-13 12:27:12.363
515e51c9-9133-481f-b7fa-03f0f99b8a32	TikTok	tiktok	https://res.cloudinary.com/ddzprakot/image/upload/v1757766502/mirchanForumMedia/categories/jemtqpttbv7jjc6qecjs.jpg	#0000	tiktok tag	2025-09-13 12:28:23.011
440fa14f-e5eb-4053-ae01-b8ab9e394eb5	Twitch	twitch	https://res.cloudinary.com/ddzprakot/image/upload/v1757766555/mirchanForumMedia/categories/sm1icqgwgimciuqfbt09.jpg	#9147ff	twitch logo	2025-09-13 12:29:17.187
72cdff88-7498-4087-9a54-ed2638675f6b	ASMR	asmr	\N	#0571c6	asmr tag	2025-09-13 12:29:53.169
\.


--
-- Data for Name: Thread; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Thread" (id, "shortId", slug, "boardId", subject, content, "authorName", "authorTrip", "posterHash", "imageUrl", "imagePublicId", "imageName", "imageSize", "thumbnailUrl", "isPinned", "isLocked", "isClosed", "isArchived", "replyCount", "imageCount", "uniquePosters", "lastBumpAt", "createdAt", "categoryId") FROM stdin;
b18acc11-9650-4dd6-83cf-45ecfb2e5f47	2pfwmy	\N	9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	тестовая тема	привет это тестовое содержание 	test	\N	db570a46	https://res.cloudinary.com/ddzprakot/image/upload/v1757018498/mirchanForumMedia/a/jtzfyn5fw0rs2guytbc9.jpg	mirchanForumMedia/a/jtzfyn5fw0rs2guytbc9	photo_2025-08-11_19-03-42.jpg	33443	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757018498/mirchanForumMedia/a/jtzfyn5fw0rs2guytbc9.jpg	f	f	f	f	3	3	1	2025-09-13 09:41:05.008	2025-09-04 20:41:39.529	\N
59cd9b77-84bc-4307-807e-6a57eff803ee	84ikyv	\N	0fc9a267-03aa-4ac3-8af9-18bcdf11e822	\N	анонимный ответ	Анон	\N	b364f409	https://res.cloudinary.com/ddzprakot/image/upload/v1757020021/mirchanForumMedia/b/uiyjz8gytbob3avybetc.jpg	mirchanForumMedia/b/uiyjz8gytbob3avybetc	photo_2025-02-16_15-00-56.jpg	36663	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757020021/mirchanForumMedia/b/uiyjz8gytbob3avybetc.jpg	f	f	f	f	13	3	1	2025-09-13 10:08:08.105	2025-09-04 21:07:02.267	\N
2ab69cde-1151-4f5f-985e-ce0cdc7e33cf	a7zado	\N	0fc9a267-03aa-4ac3-8af9-18bcdf11e822	\N	test media content mp4	Анон	\N	7a5f7fa2	https://res.cloudinary.com/ddzprakot/video/upload/v1757059086/mirchanForumMedia/b/js0cs8h7ytl0bo9xdn47.mp4	mirchanForumMedia/b/js0cs8h7ytl0bo9xdn47	610691463_847f25d7-fc17-4f43-8172-de4e80a9e033_Instagram.mp4	2297438	\N	f	f	f	f	2	1	1	2025-09-13 09:56:36.373	2025-09-05 07:58:11.49	\N
f92267b9-f68e-4dbe-8663-194195fe5bc6	llop4y	\N	0fc9a267-03aa-4ac3-8af9-18bcdf11e822	Тестовый тред	Несколько фото 	Аноним	\N	e7bef228	https://res.cloudinary.com/ddzprakot/image/upload/v1757160522/mirchanForumMedia/b/xnrw07xzxh46pxck6xoo.jpg	mirchanForumMedia/b/xnrw07xzxh46pxck6xoo	20250825_1253_Minimalist M Logo_simple_compose_01k3g3e6ntfxbs14e0snb9ph9b.png	1652114	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757160522/mirchanForumMedia/b/xnrw07xzxh46pxck6xoo.jpg	f	f	f	f	2	6	1	2025-09-06 14:21:16.551	2025-09-06 12:08:45.284	\N
e73f6620-aa49-4653-a6f0-2341e5a7577e	kndrur	\N	4c521593-65a6-443e-9a30-cad2ff89c93e	Политика(без осторожностей)	pov: садишься писать тред о политике и слышишь стук в дверь...поэтому эта ветка пустая	Антон без т	\N	0383a17a	\N	\N	\N	\N	\N	f	f	f	f	0	0	1	2025-09-08 11:07:16.301	2025-09-08 11:07:16.301	\N
28b4356b-9cc6-4b02-b359-540c5e956ac8	enpk5w	\N	0fc9a267-03aa-4ac3-8af9-18bcdf11e822	тестовый	тестовый	Аноним	\N	5e366a2d	https://res.cloudinary.com/ddzprakot/image/upload/v1757683166/mirchanForumMedia/b/cz8bawbobctzqzlymz8s.jpg	mirchanForumMedia/b/cz8bawbobctzqzlymz8s	20250825_1247_ÐÐ¾Ð³Ð¾ÑÐ¸Ð¿ Ð´Ð»Ñ Mirchan_simple_compose_01k3g319mpe518s22j73egc7dh.png	2003513	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757683166/mirchanForumMedia/b/cz8bawbobctzqzlymz8s.jpg	f	f	f	f	0	1	1	2025-09-12 13:19:28.265	2025-09-12 13:19:28.265	\N
94b4e71e-97f5-4b33-99cd-87d9610ed9f9	6x0t9u	\N	9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	тест	осыволтловысы	Аноним	\N	571df9b8	\N	\N	\N	\N	\N	f	f	f	f	2	0	1	2025-09-13 09:55:23.843	2025-09-12 14:47:25.477	\N
26749e30-a600-4ba0-aa96-c897b6cfdebe	6ckq17	test	9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	test 	тестовое содержание	Аноним	\N	23c0f9a6	https://res.cloudinary.com/ddzprakot/image/upload/v1757758296/mirchanForumMedia/a/dat02lryk1pfdpsdeuuq.jpg	mirchanForumMedia/a/dat02lryk1pfdpsdeuuq	2048x1152-pixel-kdrdqj155uykpy6d.jpg	78772	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757758296/mirchanForumMedia/a/dat02lryk1pfdpsdeuuq.jpg	f	f	f	f	1	1	1	2025-09-13 10:12:23.077	2025-09-13 10:11:37.939	eac134b1-7dc1-47dd-9426-5d4f06d4fb8a
007caaf0-5163-4577-976d-b34c93980278	s7crrm	\N	0fc9a267-03aa-4ac3-8af9-18bcdf11e822	\N	https://www.yyyyyyy.info/	Аноним	\N	67152e95	\N	\N	\N	\N	\N	f	f	f	f	0	0	1	2025-09-23 16:38:37.066	2025-09-23 16:38:37.066	\N
219d8061-c916-4b83-89be-34470bb4d8b4	d468fn	sophieraiin	9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	sophieraiin	Первый тред в категории Инстаграм фигуристой Sophie Rain 	Sophie Rain 	\N	29a451bf	https://res.cloudinary.com/ddzprakot/image/upload/v1757746819/mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh.jpg	mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh	BeFunky-collage-(7)1732879024-0-412x290.webp	15852	https://res.cloudinary.com/ddzprakot/image/upload/c_limit,f_auto,h_250,q_auto:low,w_250/v1757746819/mirchanForumMedia/a/oz73shbwj6r2nmdbjlmh.jpg	f	f	f	f	4	1	1	2026-01-05 14:30:45.595	2025-09-13 07:00:19.774	2c63bdb2-eaa1-40aa-a4b0-18bcb9b3b1f3
d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	6028630f	\N	9ae5bfc0-051d-4fe1-ab2f-7e2162b1b9af	test	тестовый тред 	Аноним	\N	a4726e4c	\N	\N	\N	\N	\N	f	f	f	f	0	0	1	2026-01-05 14:44:09.476	2026-01-05 14:33:33.245	2c63bdb2-eaa1-40aa-a4b0-18bcb9b3b1f3
\.


--
-- Data for Name: ThreadTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ThreadTag" (id, "threadId", "tagId") FROM stdin;
290f143f-ce53-49a2-84ec-6cd510a7687d	94b4e71e-97f5-4b33-99cd-87d9610ed9f9	5a80e77a-17dc-48f5-adfd-bc243ebdeb2b
6ab7ce68-e48a-4a7b-af9c-505e06a0522e	219d8061-c916-4b83-89be-34470bb4d8b4	7dd0fcef-86f5-4417-9fd7-b1e68786c7f4
e1499b02-7b39-41ec-8343-26c5b93920cd	26749e30-a600-4ba0-aa96-c897b6cfdebe	5a80e77a-17dc-48f5-adfd-bc243ebdeb2b
5171bdca-55e5-406e-8126-8f1f2c474954	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	7dd0fcef-86f5-4417-9fd7-b1e68786c7f4
adb6d9ac-15d1-4805-a1b4-d200ae83c3e6	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	245a0ce2-5664-44fc-8276-f861704e409d
f37cc622-1e79-4de9-ada9-361ed410cb40	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	32102b20-eb35-4363-a9d0-1f5d567d949e
a84cfba2-56d0-4f6e-acd9-6c210711301a	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	515e51c9-9133-481f-b7fa-03f0f99b8a32
6e221152-87bf-4b9e-9fe9-dac8067f04d5	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	440fa14f-e5eb-4053-ae01-b8ab9e394eb5
ef724560-779b-4ec5-82f2-673e82d0536a	d12c85e2-f44e-4aa4-bf40-5dec0a9fd654	5a80e77a-17dc-48f5-adfd-bc243ebdeb2b
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a9bc5964-370c-4e7a-8459-e7ae4d87eb4e	6b6792f6d7362bdda762b6b0d331e78753913a06959fb5c275b9fc96f35b993a	2025-12-12 20:51:21.42337+00	20251212204743_update_schema		\N	2025-12-12 20:51:21.42337+00	0
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, type, provider, refresh_token, access_token, expires_at, created_at, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tokens (id, email, token, type, expires_in, created_at) FROM stdin;
7e15db0d-752c-4a95-bfc0-62869e4508a5	3333333300@bk.ru	97898a73-591d-45ad-9bef-a1ddd0699b1e	VERIFICATION	2025-12-23 10:35:18.769	2025-12-23 09:35:18.791
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, username, status, "avatarUrl", "avatarFrameUrl", "backgroundUrl", "usernameFrameUrl", "dateOfBirth", role, "isActive", is_verified, method, is_two_factor_enabled, created_at, updated_at, bio, location, "lastSeen", "googleId", provider) FROM stdin;
194ba6ea-72a4-4272-9a3d-5fce2f1483e7	ymarumar502@gmail.com	\N	scroll	пользователь mirhcan		https://lh3.googleusercontent.com/a/ACg8ocLGgpgiF0Xub8LDNbJTvuQFPU2OQcWQCE3CyHUgUxKlcx64wzA=s96-c	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-10-11 05:51:38.673	2025-10-11 05:52:11.65	\N	\N	\N	116404066894907296936	google
467661e1-c998-4856-9f6e-82cfa83802f6	amirabdullazizov@gmail.com	\N	xasb1k	\N	стальной негр <3	https://lh3.googleusercontent.com/a/ACg8ocICHwa18OSXf7J7Utvca5K7Xk1GsTGh0b2985G-GUc9Kfg4VfQy=s96-c	https://shared.fastly.steamstatic.com/community_assets/images/items/933820/b6080a0f52bfc036e7de284754c2ea8781323d7b.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/601220/2c41221bc39d4b87682307a664c39cf3a17156bb.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-11-12 09:40:34.143	2025-11-28 11:54:39.935	\N	\N	\N	101111472956416582042	google
5121eb10-106d-4d32-8e0c-ddcc4dadaca9	ar9033240@gmail.com	$2a$10$Og6tZ9BDaUdoHPJT3ygB0.dH4Px3yIEeWytf1Emj8Jy6FeBW8d.BG	☠༆ᴺᵉˣᵘˢᏃᎬᎡϴ༒	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1757364317/mirchanAvatars/%E2%98%A0%E0%BC%86%E1%B4%BA%E1%B5%89%CB%A3%E1%B5%98%CB%A2%E1%8F%83%E1%8E%AC%E1%8E%A1%CF%B4%E0%BC%92_1757364317160.jpg	https://shared.fastly.steamstatic.com/community_assets/images/items/1232580/400a2d0836f66c37626071ef8ae10554b481bd80.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/774171/fadd8bc9ccf0ac84881c83dd32812004d7d54e14.mp4	\N	2007-09-28 00:00:00	REGULAR	t	t	CREDENTIALS	f	2025-09-08 20:40:17.734	2025-10-19 22:04:04.244	Кто прочитал тот юзером MAXа стал	Mirgard city	\N	\N	\N
52ae1a9b-c0ae-4018-a947-43ec72f51e37	d9dly9@gmail.com	\N	d9dly deadly	\N	В поисках интересных тем… 	https://lh3.googleusercontent.com/a/ACg8ocLU3mlEW0cSZox9X5FnM_NaDR2nzXwt8a4YiP9RB4FjTJOGng=s96-c	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-12-11 21:25:08.209	2025-12-11 21:26:20.68	\N	\N	\N	693b36b47e4ccc7f5e31e41d	google
7c5dd46f-7a4e-4bc2-8aeb-7349c584c513	foz1l0v240705@gmail.com	$2a$10$CoSqjEeQXPxOTOXsv3FOBOMW6fHBSEkXQ3XfJLo8TXObNZHgse6/G	Fozilov	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1757940487/mirchanAvatars/Fozilov_1757940485702.png	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-15 12:48:07.449	2025-09-15 12:49:59.855	\N	\N	\N	\N	\N
b370cea7-450d-4f05-8d57-78676ad9f83c	mproper367@gmail.com	\N	YakkoUoner ツ	пользователь mirhcan		https://lh3.googleusercontent.com/a/ACg8ocJ9l9EbCAD9sOPni7-RR2HoRXKhQYK7MZs_--t7CBf84TDzTXSj=s96-c	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-10-06 13:35:59.784	2025-10-06 13:39:02.614	\N	\N	\N	110156068848758566530	google
f71ffa4d-9376-4bad-831b-4b392ddbc048	test@test.com	$2a$10$7WO61.od4JTOFNIbfZuQh.74zg56uaT.G8qGzHKnH7k6EFi0i2GCu	test	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1756929811/mirchanAvatars/test_1756929810139.png	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-03 20:03:32.134	2025-09-03 20:03:32.134	\N	\N	\N	\N	\N
69eacf97-c138-4e82-bed0-66fa3752d78a	vladhaker85@gmail.com	$2a$10$22YrkB2uhj70SmB24BDYpeCAI5UYfZ87pJS2I.lgq/ubyaapL1gfC	Admin	admin	я Админ\n	https://res.cloudinary.com/ddzprakot/image/upload/v1763152042/mirchanAvatars/Admin_1763152042706.jpg	https://shared.fastly.steamstatic.com/community_assets/images/items/1218900/1eeb706141080466dfc06761d6acd263dcfd4bc6.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/2316400/fa00e26e263543ef86a2cdbe6563f5714e2bac49.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-11-09 10:56:14.443	2025-11-16 11:52:26.69	заинтересовал проект? \r\nследи за обновлениями	Миргард	\N	\N	\N
3b36f689-02fd-4958-a8b7-98f83b1d6770	saugabaevnurlan@gmail.com	$2a$10$mG.0xQq3OxYbxIJdQw1lfeMobyoPY0HgQ4Ry5HWy8xd1xIJLqu5Au	Nurjan	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1757333551/mirchanAvatars/Nurjan_1757333551029.jpg	https://shared.fastly.steamstatic.com/community_assets/images/items/2887910/03752cfffc9e55445b9c9aef299ed991ff54e18b.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1012790/ecaec9741996bd52333b5d0848504d840b1a5206.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-08 12:10:51.314	2025-09-08 12:14:04.06	\N	\N	\N	\N	\N
207b302d-6504-4e0a-be43-5831cba49e2a	Neivo@gmail.com	$2a$10$QS1wJup4FmHFDmH9QiFwtefH5j14u2czVORqa06TFNFa.Pucthc3K	Neivo	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1756932455/mirchanAvatars/Neivo_1756932455468.jpg	https://shared.fastly.steamstatic.com/community_assets/images/items/933820/b6080a0f52bfc036e7de284754c2ea8781323d7b.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1239690/dcfed8cceb3d7c74432294aec5fff49050b2ef1b.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-03 20:43:16.07	2025-11-08 18:30:47.888	Если ты не гомосек, жду лям долларов на счёт. За 10 сек	Миргард City	\N		\N
0d3f42f8-05e4-4728-8c5b-31665000b834	pulatovfarruh369@gmail.com	\N	Фаррух Пулатов	\N	В поисках интересных тем… 	https://lh3.googleusercontent.com/a/ACg8ocL0cB433ewANPsuNdtWTKgyny8yJNZdKPzyaPqmq8hXnD-G6MHF=s96-c	https://shared.akamai.steamstatic.com/community_assets/images/items/2160470/d53ca26380b75490cece13536cedab5cf4fd59fa.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/579720/8144c4de0312c256889580d7e7de5bc4ccf84fda.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-11-12 09:06:48.02	2025-11-12 09:10:01.192	\N	\N	\N	109502482222909794428	google
0454d8eb-63a2-449b-9965-c01994c73971	satipovakbar@gmail.com	\N	AkbaAli Satipov	\N	В поисках интересных тем… 	https://lh3.googleusercontent.com/a/ACg8ocJT9SoSfLDtBKTileV_h8UkfxvtGiKtlJEx9w_ka2ATEkQBpNST=s96-c	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-12-09 17:39:06.105	2025-12-09 18:36:35.083	\N	\N	\N	69385eba7521dc4b9b799344	google
e5fbff75-13b4-4121-9fb7-d320c58c6234	mirchan.contact@gmail.com	\N	Mirchan	пользователь mirhcan		https://lh3.googleusercontent.com/a/ACg8ocInGvgHINBvLwmVrhms9S4P4Mc8G8AVsBuItcf4gqmEdTBmviM=s96-c	https://shared.akamai.steamstatic.com/community_assets/images/items/1232580/7e41e2a48ea057e0f6267ff736815cd1354e04d3.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1239690/f032ec4916fad9f6f64ecb7a9f083e835f65e362.mp4	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-02 15:13:29.112	2025-12-01 21:08:11.653	\N	\N	\N	68b7099b9c12ad958628120f	google
e8169a04-f6ca-44a2-96b2-ea310d0d389c	kspirilin@bk.ru	$2a$10$cfDOxBMvOEG9Z8T3SMEmkedJgOirMkA8CVGiFXw89UI7CYD0YQSUm	Костя 	пользователь mirhcan		https://res.cloudinary.com/ddzprakot/image/upload/v1757769755/mirchanAvatars/%D0%9A%D0%BE%D1%81%D1%82%D1%8F%20_1757769754461.png	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-13 13:22:35.803	2025-09-13 13:24:23.503	\N	\N	\N	\N	\N
f9ca604e-926e-4316-b61b-e8c07dd512af	vladgamer1175@gmail.com	\N	Vladislav Dev	пользователь mirhcan		https://lh3.googleusercontent.com/a/ACg8ocL_pcErANkJ8bhj-27yl6ur9Wi_uNHO-Ys2VpJpailv5D8hDBw=s96-c	\N	\N	\N	\N	REGULAR	t	t	CREDENTIALS	f	2025-09-21 16:21:14.86	2025-09-21 19:17:16.746	\N	\N	\N	68d025fb85c2fe49784b233f	google
201ce36f-d070-4ff2-8f37-fff1454f9953	3333333300@bk.ru	$argon2id$v=19$m=65536,t=3,p=4$QfyhbhlEFzbiBH0RT+w5LQ$ScBym4upRYkUwK2nA6AU36s1u9aALSAYMcXiVsV+u50	Putin	пользователь mirchan	В поисках интересных тем… 	https://res.cloudinary.com/ddzprakot/image/upload/v1766482517/mirchanAvatars/Putin_1766482517342.png	\N	\N	\N	\N	REGULAR	t	f	CREDENTIALS	f	2025-12-23 09:35:18.673	2025-12-23 09:35:18.673	\N	\N	\N	\N	\N
17149290-e755-4306-8b69-44a6e1fda70b	vladgrechkoseev85@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$xegXkkzPr5fjei2szHHwtA$GxcDWiZXogvvBolbjuNUOyX4W0Nla933FAJKsAamjoY	Vladislav Dev	vladislavDev	шелест утренних звезд	https://res.cloudinary.com/ddzprakot/image/upload/v1763151835/mirchanAvatars/Vladislav%20Dev_1763151835233.jpg	https://shared.fastly.steamstatic.com/community_assets/images/items/933820/b6080a0f52bfc036e7de284754c2ea8781323d7b.png	https://cdn.akamai.steamstatic.com/steamcommunity/public/images/items/1263950/248954cba9bc08b6e16c676f5c1814ff823af907.mp4	https://simpcity.cr/custom/Effects/src/test1ff.gif	\N	ADMIN	t	t	CREDENTIALS	f	2025-09-02 15:24:37.593	2025-12-18 18:32:22.362	the creator of this project	Mirgard	\N	6917864ac00ee096bb7f9a15	google
\.


--
-- Name: Ban Ban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_pkey" PRIMARY KEY (id);


--
-- Name: Board Board_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Board"
    ADD CONSTRAINT "Board_pkey" PRIMARY KEY (id);


--
-- Name: Categories Categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_pkey" PRIMARY KEY (id);


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Follows Follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_pkey" PRIMARY KEY (id);


--
-- Name: Like Like_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY (id);


--
-- Name: MediaFile MediaFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaFile"
    ADD CONSTRAINT "MediaFile_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: ModAction ModAction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ModAction"
    ADD CONSTRAINT "ModAction_pkey" PRIMARY KEY (id);


--
-- Name: Notice Notice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notice"
    ADD CONSTRAINT "Notice_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: Reply Reply_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reply"
    ADD CONSTRAINT "Reply_pkey" PRIMARY KEY (id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: ThreadTag ThreadTag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadTag"
    ADD CONSTRAINT "ThreadTag_pkey" PRIMARY KEY (id);


--
-- Name: Thread Thread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Ban_boardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ban_boardId_idx" ON public."Ban" USING btree ("boardId");


--
-- Name: Ban_ipHash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ban_ipHash_idx" ON public."Ban" USING btree ("ipHash");


--
-- Name: Ban_isActive_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ban_isActive_expiresAt_idx" ON public."Ban" USING btree ("isActive", "expiresAt");


--
-- Name: Ban_moderatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ban_moderatorId_idx" ON public."Ban" USING btree ("moderatorId");


--
-- Name: Board_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Board_isActive_idx" ON public."Board" USING btree ("isActive");


--
-- Name: Board_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Board_name_idx" ON public."Board" USING btree (name);


--
-- Name: Board_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Board_name_key" ON public."Board" USING btree (name);


--
-- Name: Categories_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Categories_parentId_idx" ON public."Categories" USING btree ("parentId");


--
-- Name: Categories_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Categories_slug_idx" ON public."Categories" USING btree (slug);


--
-- Name: Categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Categories_slug_key" ON public."Categories" USING btree (slug);


--
-- Name: Chat_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Chat_lastMessageAt_idx" ON public."Chat" USING btree ("lastMessageAt");


--
-- Name: Comment_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Comment_postId_idx" ON public."Comment" USING btree ("postId");


--
-- Name: Comment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Comment_userId_idx" ON public."Comment" USING btree ("userId");


--
-- Name: Follows_followerId_followingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Follows_followerId_followingId_key" ON public."Follows" USING btree ("followerId", "followingId");


--
-- Name: Follows_followerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Follows_followerId_idx" ON public."Follows" USING btree ("followerId");


--
-- Name: Follows_followingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Follows_followingId_idx" ON public."Follows" USING btree ("followingId");


--
-- Name: Like_postId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Like_postId_idx" ON public."Like" USING btree ("postId");


--
-- Name: Like_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Like_userId_idx" ON public."Like" USING btree ("userId");


--
-- Name: Like_userId_postId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Like_userId_postId_key" ON public."Like" USING btree ("userId", "postId");


--
-- Name: MediaFile_replyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MediaFile_replyId_idx" ON public."MediaFile" USING btree ("replyId");


--
-- Name: MediaFile_threadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MediaFile_threadId_idx" ON public."MediaFile" USING btree ("threadId");


--
-- Name: Message_chatId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_chatId_idx" ON public."Message" USING btree ("chatId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: ModAction_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModAction_createdAt_idx" ON public."ModAction" USING btree ("createdAt");


--
-- Name: ModAction_moderatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModAction_moderatorId_idx" ON public."ModAction" USING btree ("moderatorId");


--
-- Name: ModAction_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModAction_targetType_targetId_idx" ON public."ModAction" USING btree ("targetType", "targetId");


--
-- Name: Notice_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notice_userId_idx" ON public."Notice" USING btree ("userId");


--
-- Name: Post_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_authorId_idx" ON public."Post" USING btree ("authorId");


--
-- Name: Post_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Post_createdAt_idx" ON public."Post" USING btree ("createdAt");


--
-- Name: Reply_posterHash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reply_posterHash_idx" ON public."Reply" USING btree ("posterHash");


--
-- Name: Reply_shortId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reply_shortId_idx" ON public."Reply" USING btree ("shortId");


--
-- Name: Reply_shortId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Reply_shortId_key" ON public."Reply" USING btree ("shortId");


--
-- Name: Reply_threadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reply_threadId_idx" ON public."Reply" USING btree ("threadId");


--
-- Name: Reply_threadId_postNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Reply_threadId_postNumber_key" ON public."Reply" USING btree ("threadId", "postNumber");


--
-- Name: Tag_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tag_slug_idx" ON public."Tag" USING btree (slug);


--
-- Name: Tag_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tag_slug_key" ON public."Tag" USING btree (slug);


--
-- Name: ThreadTag_tagId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ThreadTag_tagId_idx" ON public."ThreadTag" USING btree ("tagId");


--
-- Name: ThreadTag_threadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ThreadTag_threadId_idx" ON public."ThreadTag" USING btree ("threadId");


--
-- Name: ThreadTag_threadId_tagId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ThreadTag_threadId_tagId_key" ON public."ThreadTag" USING btree ("threadId", "tagId");


--
-- Name: Thread_boardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Thread_boardId_idx" ON public."Thread" USING btree ("boardId");


--
-- Name: Thread_boardId_lastBumpAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Thread_boardId_lastBumpAt_idx" ON public."Thread" USING btree ("boardId", "lastBumpAt");


--
-- Name: Thread_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Thread_categoryId_idx" ON public."Thread" USING btree ("categoryId");


--
-- Name: Thread_isPinned_lastBumpAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Thread_isPinned_lastBumpAt_idx" ON public."Thread" USING btree ("isPinned", "lastBumpAt");


--
-- Name: Thread_shortId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Thread_shortId_idx" ON public."Thread" USING btree ("shortId");


--
-- Name: Thread_shortId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Thread_shortId_key" ON public."Thread" USING btree ("shortId");


--
-- Name: tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tokens_token_key ON public.tokens USING btree (token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: Ban Ban_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public."Board"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ban Ban_moderatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Categories Categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Categories"(id);


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follows Follows_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Follows Follows_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Follows"
    ADD CONSTRAINT "Follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MediaFile MediaFile_replyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaFile"
    ADD CONSTRAINT "MediaFile_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES public."Reply"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MediaFile MediaFile_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaFile"
    ADD CONSTRAINT "MediaFile_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."Thread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."Chat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModAction ModAction_moderatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ModAction"
    ADD CONSTRAINT "ModAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reply Reply_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reply"
    ADD CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."Thread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ThreadTag ThreadTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadTag"
    ADD CONSTRAINT "ThreadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ThreadTag ThreadTag_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ThreadTag"
    ADD CONSTRAINT "ThreadTag_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."Thread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Thread Thread_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public."Board"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Thread Thread_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Categories"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict dR58LnbhTidddKT3EEy1Do075g6UbR9HQAj0RbsvINmaWG9EzMFDFb8bNPF715x

