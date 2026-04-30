import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dir, '../data/kirundi-vocab.json');

const supabase = createClient(
  'https://fugsjhakenoiqdsgbqzf.supabase.co',
  'sb_publishable_lxO8wgBQg6ghTX3aktm05w_98rv0-tw',
);

// ── Complete English → French translation map ─────────────────────────────
const VOCAB_FR = {
  // Body parts
  "eye":"œil","eyes":"yeux","nose":"nez","chin":"menton","cheek":"joue",
  "ear":"oreille","eyebrow":"sourcil","hair":"cheveux","moustache":"moustache",
  "beard":"barbe","tooth":"dent","teeth":"dents","tongue":"langue","head":"tête",
  "mouth":"bouche","forehead":"front","skull":"crâne","hand":"main","palm":"paume",
  "finger":"doigt","thumb":"pouce","index finger":"index","middle finger":"majeur",
  "ring finger":"annulaire","little finger":"auriculaire","nail":"ongle","leg":"jambe",
  "foot":"pied","neck":"cou","shoulder":"épaule","elbow":"coude","knee":"genou",
  "back":"dos","chest":"poitrine","lung":"poumon","heart":"cœur","blood":"sang",
  "breast":"sein","rib":"côte","intestine":"intestin","kidney":"rein","liver":"foie",
  "nerve":"nerf","naval":"nombril","buttocks":"fesses","thigh":"cuisse",
  "ankle":"cheville","toe":"orteil","heel":"talon","arm":"bras",
  // Family
  "the parents":"les parents","the father":"le père","the mother":"la mère",
  "daddy":"papa","mummy":"maman","child":"enfant","the children":"les enfants",
  "a son":"un fils","a daughter":"une fille","a boy":"un garçon","a girl":"une fille",
  "a brother":"un frère","a sister":"une sœur","my sister":"ma sœur","my brother":"mon frère",
  "well bred person":"personne bien élevée","ill-bred person":"personne mal élevée",
  "an only child":"enfant unique","the kinsmen":"les proches","grandchild":"petit-enfant",
  "friends and relatives":"amis et famille","relatives":"parents",
  "relations":"relations","kinsfolk":"proches parents","son-in-law":"gendre",
  "aunt":"tante","uncle":"oncle","niece":"nièce","nephew":"neveu",
  "daughter in law":"belle-fille","step mother":"belle-mère","step father":"beau-père",
  "step brother":"demi-frère","step sister":"demi-sœur",
  // Food
  "food":"nourriture","meat":"viande","fish":"poisson","beans":"haricots","peas":"petits pois",
  "chicken":"poulet","bread":"pain","honey":"miel","sausage":"saucisse","soup":"soupe",
  "cabbage":"chou","potato":"pomme de terre","sweet potato":"patate douce","sweets":"bonbons",
  "onion":"oignon","tomato":"tomate","mushrooms":"champignons","flour":"farine","egg":"œuf",
  "salt":"sel","oil":"huile","lemon":"citron","orange":"orange","mango":"mangue",
  "sugarcane":"canne à sucre","pineapple":"ananas","guava":"goyave","papaya":"papaye",
  "sweet banana":"banane douce",
  // Drinks
  "a drink":"une boisson","milk":"lait","wine":"vin","juice":"jus","water":"eau",
  "drinking water":"eau potable","soft drinks":"boissons gazeuses","hot drinks":"boissons chaudes",
  "cold drinks":"boissons froides","coffee":"café","tea":"thé","lemon tea":"thé au citron",
  "fruit juice":"jus de fruits","lemonade":"limonade","orange juice":"jus d'orange",
  "tomato juice":"jus de tomate","pineapple juice":"jus d'ananas","beer":"bière",
  "primus beer":"bière Primus","hunger":"faim","to eat":"manger","to chew":"mâcher",
  "to swallow":"avaler","thirst":"soif","to drink":"boire","I am thirsty":"j'ai soif",
  "I am starving":"je meurs de faim","it tastes good":"c'est bon","to cook":"cuisiner",
  "to cook fish":"cuisiner le poisson","enjoy your meal!":"bon appétit !",
  // Clothing
  "shoes":"chaussures","flip-flops":"tongs","slippers":"pantoufles",
  "sport shoes":"chaussures de sport","leather":"cuir","shoestring":"lacet",
  "outfit":"tenue","costume":"costume","skirt":"jupe","dress":"robe","trousers":"pantalon",
  "short":"short","shirt":"chemise","t-shirt":"t-shirt","mini-skirt":"mini-jupe",
  "cap":"casquette","hat":"chapeau","tie":"cravate","socks":"chaussettes",
  "rain coat":"imperméable","underwears":"sous-vêtements","gloves":"gants",
  "sportswear":"tenue de sport","night suit":"pyjama",
  // Household
  "cupboard":"armoire","mirror":"miroir","fan":"ventilateur","air conditioner":"climatiseur",
  "clock":"horloge","bed":"lit","bed sheet":"drap de lit","wash basin":"lavabo",
  "shower":"douche","bucket":"seau","pull":"tirette","soap":"savon",
  "toothbrush":"brosse à dents","toothpaste":"dentifrice","razor":"rasoir","comb":"peigne",
  "dinner plate":"assiette","serving spoon":"cuillère de service","fork":"fourchette",
  "knife":"couteau","spoon":"cuillère","teaspoon":"petite cuillère","iron":"fer à repasser",
  "refrigerator":"réfrigérateur","nailpolish":"vernis à ongles","powder":"poudre","carpet":"tapis",
  // Numbers
  "zero":"zéro","one":"un","two":"deux","three":"trois","four":"quatre","five":"cinq",
  "six":"six","seven":"sept","eight":"huit","nine":"neuf","ten":"dix","eleven":"onze",
  "twelve":"douze","thirteen":"treize","fourteen":"quatorze","fifteen":"quinze",
  "sixteen":"seize","seventeen":"dix-sept","eighteen":"dix-huit","nineteen":"dix-neuf",
  "twenty":"vingt","thirty":"trente","forty":"quarante","fifty":"cinquante","sixty":"soixante",
  "seventy":"soixante-dix","eighty":"quatre-vingts","ninety":"quatre-vingt-dix",
  "one hundred":"cent","two hundred":"deux cents","one thousand":"mille",
  "two thousand":"deux mille","one million":"un million","two million":"deux millions",
  "one billion":"un milliard",
  // Time
  "a watch":"une montre","a hand":"une aiguille","the minutes hand":"l'aiguille des minutes",
  "the hour hand":"l'aiguille des heures","the seconds":"les secondes","an hour":"une heure",
  "a minute":"une minute","a second":"une seconde","on time":"à l'heure",
  "be late":"être en retard","before time":"en avance","sun":"soleil","moon":"lune",
  "stars":"étoiles","the sky":"le ciel","clouds":"nuages","morning":"matin",
  "afternoon":"après-midi","evening":"soir","night":"nuit","today":"aujourd'hui",
  "yesterday":"hier","tomorrow":"demain","day before yesterday":"avant-hier",
  "day after tomorrow":"après-demain","last week":"la semaine dernière",
  "next week":"la semaine prochaine","last month":"le mois dernier",
  "next month":"le mois prochain","last year":"l'année dernière","next year":"l'année prochaine",
  "in the morning":"le matin","in the afternoon":"l'après-midi","in the evening":"le soir",
  "at night":"la nuit","now":"maintenant","next time":"la prochaine fois",
  "last time":"la dernière fois","at the sun rise":"au lever du soleil",
  "at the sunset":"au coucher du soleil","monday":"lundi","tuesday":"mardi",
  "wednesday":"mercredi","thursday":"jeudi","friday":"vendredi","saturday":"samedi",
  "sunday":"dimanche","january":"janvier","february":"février","march":"mars",
  "april":"avril","may":"mai","june":"juin","july":"juillet","august":"août",
  "september":"septembre","october":"octobre","november":"novembre","december":"décembre",
  // Health
  "health":"santé","life":"vie","medicine":"médicament","sickness":"maladie",
  "illness":"maladie","disease":"maladie","a patient":"un patient","a sick person":"un malade",
  "madness":"folie","madman":"fou","nurse":"infirmier","doctor":"médecin",
  "prescription":"ordonnance","AIDS":"SIDA","ambulance":"ambulance","abortion":"avortement",
  "blood test":"analyse de sang","blood transfusion":"transfusion sanguine",
  "blood group":"groupe sanguin","backache":"mal de dos","headache":"mal de tête",
  "toothache":"mal aux dents","cancer":"cancer","contagious illness":"maladie contagieuse",
  "diabetes":"diabète","dentist":"dentiste","epidemic":"épidémie",
  "heart disease":"maladie cardiaque","heart rate":"rythme cardiaque",
  "insect bite":"piqûre d'insecte","malaria":"paludisme","paediatrics":"pédiatrie",
  "polio":"polio","surgery":"chirurgie","surgeon":"chirurgien","skin disease":"maladie de peau",
  "tuberculosis":"tuberculose","tablet":"comprimé","virus":"virus",
  "health center":"centre de santé","hospital":"hôpital","to cure":"guérir",
  "to nurse":"soigner","to get well":"se rétablir","to recover":"récupérer",
  "to be in good health":"être en bonne santé","to be ill":"être malade",
  "to be sick":"être malade","to have headache":"avoir mal à la tête",
  "to have toothache":"avoir mal aux dents","injection":"injection","appointment":"rendez-vous",
  // Trading
  "goods":"marchandises","trader":"commerçant","market":"marché","to sell":"vendre",
  "to buy":"acheter","to be sold":"être vendu","to be bought":"être acheté","to pay":"payer",
  "a heap":"un tas","kiosk":"kiosque","scale":"balance","to weigh":"peser",
  "repairers":"réparateurs","television engineer":"technicien TV","to heap up":"entasser",
  "profit":"bénéfice","a loss":"une perte","sugar":"sucre","a plastic bag":"un sac plastique",
  "factory":"usine","a boss":"un patron","an employer":"un employeur","an employee":"un employé",
  "money":"argent","a rich man":"un homme riche","a poor man":"un homme pauvre",
  "to save":"économiser","expensive":"cher","cheap":"pas cher","to park":"se garer",
  // Politics
  "peace process":"processus de paix","opponents":"opposants","senator":"sénateur",
  "general meeting":"réunion générale","head of state":"chef d'État","president":"président",
  "chairman":"président","minister":"ministre","ministry":"ministère",
  "first vice-president":"premier vice-président","second vice-president":"deuxième vice-président",
  "mediator":"médiateur","junior minister":"sous-ministre","secretary general":"secrétaire général",
  "spokesman":"porte-parole","state highway":"route nationale","member of parliament":"député",
  "politic":"politique","politician":"politicien","office":"bureau","civilian":"civil",
  "presidency":"présidence","political party":"parti politique","ethnic":"ethnie",
  "peace":"paix","a flag":"un drapeau","polling":"scrutin","vote":"vote","to elect":"élire",
  "disturbance":"trouble",
  // Army
  "soldier":"soldat","common soldier":"simple soldat","commander":"commandant",
  "captain":"capitaine","colonel":"colonel","major":"major",
  "brigadier general":"général de brigade","lieutenant":"lieutenant","rank":"grade",
  "bullet-proof":"pare-balles","armoured car":"véhicule blindé","war bus":"bus de guerre",
  "warship":"navire de guerre","bullet":"balle","shell":"obus","bomb":"bombe",
  "murderer":"meurtrier","to murder":"assassiner","to kill":"tuer","to behead":"décapiter",
  "army uniform":"uniforme militaire","staff":"état-major","the no go area":"zone interdite",
  "gun":"arme à feu","commandment":"commandement","command":"ordre","to attack":"attaquer",
  "warlike":"belliqueux","warrior":"guerrier","rebel":"rebelle","gun man":"homme armé",
  "ex-serviceman":"ancien combattant","war":"guerre",
  // Pets
  "a duck":"un canard","a hen":"une poule","a calf":"un veau","a pig":"un cochon",
  "a rooster":"un coq","a cock":"un coq","chicks":"poussins","duckling":"caneton",
  "a goat":"une chèvre","a dog":"un chien","rabbit":"lapin","a cat":"un chat",
  "a horse":"un cheval","a cow":"une vache","a sheep":"un mouton","a dove":"une colombe",
  "a bird":"un oiseau","a parrot":"un perroquet","a fish":"un poisson","a tortoise":"une tortue",
  // Wild animals
  "a lion":"un lion","an elephant":"un éléphant","a crocodile":"un crocodile",
  "a monkey":"un singe","a gazelle":"une gazelle","antelope":"antilope","a bear":"un ours",
  "a snake":"un serpent","a rat":"un rat","a mosquito":"un moustique","a fly":"une mouche",
  "an earthworm":"un ver de terre","a worm":"un ver","a grass snake":"une couleuvre",
  "a lizard":"un lézard","a frog":"une grenouille","a buffalo":"un buffle","a camel":"un chameau",
  "a pigeon":"un pigeon","a giraffe":"une girafe","gorilla":"gorille",
  "a hippopotamus":"un hippopotame","a snail":"un escargot","a zebra":"un zèbre",
  "an ant":"une fourmi","a big ant":"une grande fourmi","a red ant":"une fourmi rouge",
  "a cicada":"une cigale","a butterfly":"un papillon","a grasshopper":"une sauterelle",
  "a spider":"une araignée","a louse":"un pou","a bee":"une abeille","a wasp":"une guêpe",
  "a sparrow":"un moineau","a crow":"un corbeau","an eagle":"un aigle","an owl":"un hibou",
  "a swallow":"une hirondelle","an animal":"un animal","an insect":"un insecte",
  "an amphibian":"un amphibien","a reptile":"un reptile","a mammal":"un mammifère",
  "herbivorous":"herbivore","carnivorous":"carnivore","an egg":"un œuf","a beak":"un bec",
  "a paw":"une patte","a tail":"une queue","a skin":"une peau","a scale":"une écaille",
  "a fin":"une nageoire","a horn":"une corne","a hump":"une bosse","a feather":"une plume",
  "a claw":"une griffe","a wing":"une aile","a nest":"un nid","a spider-web":"une toile d'araignée",
  // Transport
  "a vehicle":"un véhicule","a bus":"un bus","a train":"un train","a plane":"un avion",
  "a motorbike":"une moto","a cycle":"un cycle","a bicycle":"un vélo","a boat":"un bateau",
  "a motorboat":"un bateau à moteur","a ship":"un navire","a tractor":"un tracteur",
  "an ambulance":"une ambulance","a helicopter":"un hélicoptère","on foot":"à pied",
  "by plane":"en avion","by bus":"en bus","by boat":"en bateau","the wheel":"la roue",
  "the tyre":"le pneu","the engine":"le moteur","the door":"la porte","the window":"la fenêtre",
  "the windscreen":"le pare-brise","the seat":"le siège","the steering wheel":"le volant",
  "the rear-view mirror":"le rétroviseur","the number plate":"la plaque d'immatriculation",
  "the driver":"le conducteur","to drive":"conduire","to reverse":"faire marche arrière",
  "to turn left":"tourner à gauche","to turn right":"tourner à droite","to cross":"traverser",
  "to overtake":"dépasser","to break":"freiner","to stop":"s'arrêter","to fix":"réparer",
  "the garage":"le garage","petrol":"essence","a fine":"une amende",
  "to hit a tree":"percuter un arbre","to bump":"se heurter","to damage":"abîmer",
  // Occupations
  "a peasant":"un paysan","a farmer":"un agriculteur","a bike taxi-man":"un taxi-vélo",
  "a watchman":"un gardien","a baby sitter":"une baby-sitter","a preacher":"un prédicateur",
  "a headmaster":"un directeur d'école","a witch":"une sorcière","a witch doctor":"un guérisseur",
  "a cowboy":"un cow-boy","a butcher":"un boucher","a doctor":"un médecin",
  "a teacher":"un enseignant","dancer":"danseur","a singer":"un chanteur","a tailor":"un tailleur",
  "a cobbler":"un cordonnier","a baker":"un boulanger","writer":"écrivain",
  "a police officer":"un policier","painter":"peintre","a driver":"un conducteur",
  "a politician":"un politicien","a journalist":"un journaliste","a judge":"un juge",
  "photographer":"photographe","a blacksmith":"un forgeron","a barber":"un coiffeur",
  "a sweeper":"un balayeur","a mason":"un maçon","a player":"un joueur","a prayer":"une prière",
  "a businessperson":"un homme d'affaires","a trader":"un commerçant",
};

const PHRASES_FR = {
  "Good morning!":"Bonjour !","Good afternoon!":"Bonne après-midi !","Good evening!":"Bonsoir !",
  "How do you do?":"Comment allez-vous ?","Hello!":"Bonjour !","Hi!":"Salut !",
  "How are you?":"Comment vas-tu ?","How are you doing?":"Comment tu vas ?",
  "How is it going?":"Comment ça se passe ?","How are things?":"Comment vont les choses ?",
  "How is life treating you?":"Comment la vie te traite-t-elle ?","What's up?":"Quoi de neuf ?",
  "Are you fit?":"Tu vas bien ?","Are you ok?":"Ça va ?","I'm fine":"Je vais bien",
  "I'm OK":"Je vais bien","I'm just fine":"Tout va bien","Everything goes well":"Tout va bien",
  "I'm wonderful":"Je vais à merveille","I'm not fine":"Je ne vais pas bien",
  "I'm in pain":"J'ai mal","Everything goes wrong":"Tout va mal","Nothing goes":"Rien ne va",
  "I'm so-so":"Comme ci, comme ça","I'm fifty-fifty":"À moitié bien",
  "Greetings to John":"Salutations à Jean","Say hello to my uncle":"Dis bonjour à mon oncle",
  "Give love to my parents":"Passe mes amitiés à mes parents",
  "Where are you going to?":"Où vas-tu ?","Where are you heading for?":"Vers où tu te diriges ?",
  "Where to?":"Où vas-tu ?","I'm going to the movie":"Je vais au cinéma",
  "I'm going to town":"Je vais en ville","Where are you in a hurry to?":"Où tu te dépêches ?",
  "I'm in a hurry to church":"Je me dépêche pour aller à l'église",
  "I'm rushing to the market":"Je cours au marché",
  "Where do you come from?":"D'où viens-tu ?","Where are you coming from?":"D'où tu viens ?",
  "I come from Bujumbura":"Je viens de Bujumbura","I come from work":"Je viens du travail",
  "Where do you live?":"Où habites-tu ?","Where do you stay?":"Où tu résides ?",
  "I live at Bwiza":"J'habite à Bwiza","I dwell in Burundi":"Je vis au Burundi",
  "What's your name?":"Comment tu t'appelles ?","How are you called?":"Comment on t'appelle ?",
  "My name is Makobora":"Je m'appelle Makobora","Could you tell me your name?":"Peux-tu me dire ton nom ?",
  "Where were you born?":"Où es-tu né(e) ?","I was born in Cibitoke":"Je suis né(e) à Cibitoke",
  "When were you born?":"Quand es-tu né(e) ?","I was born in 1985":"Je suis né(e) en 1985",
  "How old are you?":"Quel âge as-tu ?","I am 27 years old":"J'ai 27 ans",
  "What's your occupation?":"Quelle est ta profession ?",
  "What do you do in your life?":"Qu'est-ce que tu fais dans la vie ?",
  "I'm a doctor":"Je suis médecin","I'm a trader":"Je suis commerçant(e)",
  "I'm a soldier":"Je suis soldat","I'm a preacher":"Je suis prédicateur",
  "Hello girl!":"Salut la fille !","Hello":"Bonjour","Cool. And you?":"Cool. Et toi ?",
  "I mustn't grumble. Sorry to trouble you. What's your name?":"Je ne peux pas me plaindre. Excuse-moi de te déranger. Comment tu t'appelles ?",
  "I'm Jen Akimana, and how are you called?":"Je suis Jen Akimana, et toi comment tu t'appelles ?",
  "Call me Marc.":"Appelle-moi Marc.","So Mark, where do you come from and where to?":"Alors Marc, d'où viens-tu et où vas-tu ?",
  "I come from home and I'm going to town. Anyway, where and when were you born?":"Je viens de chez moi et je vais en ville. Soit dit en passant, où et quand es-tu né(e) ?",
  "I was born in Gitega, 1988. And how old are you?":"Je suis né(e) à Gitega en 1988. Et toi, quel âge as-tu ?",
  "I'm 25 years old.":"J'ai 25 ans.","Mark, where do you live?":"Marc, où habites-tu ?",
  "I live at Ruhagarika near Iwacu Kazoza School":"J'habite à Ruhagarika, près de l'école Iwacu Kazoza",
  "Look at the time Mark, goodbye!":"Regarde l'heure Marc, au revoir !",
  "Mind how you go.":"Fais attention en chemin.",
  "Can I have a soap please?":"Est-ce que je peux avoir du savon s'il te plaît ?",
  "Could I have a cup of tea please?":"Puis-je avoir une tasse de thé s'il te plaît ?",
  "Could you give your phone number please?":"Peux-tu me donner ton numéro de téléphone s'il te plaît ?",
  "Can you show me the way to Buyenzi?":"Peux-tu m'indiquer le chemin vers Buyenzi ?",
  "Excuse me, do you know if the headmaster is in the office?":"Excusez-moi, savez-vous si le directeur est dans son bureau ?",
  "Excuse me, is this the right way for the Post Office?":"Excusez-moi, est-ce bien la bonne direction pour la Poste ?",
  "This is for you.":"C'est pour toi.","It's only something small, but I hope you'll like it.":"C'est juste un petit quelque chose, mais j'espère que tu aimeras.",
  "Thank you so much! It's wonderful.":"Merci beaucoup ! C'est merveilleux.",
  "It's something I've always wanted!":"C'est quelque chose que j'ai toujours voulu !",
  "How kind of you!":"Comme c'est gentil de ta part !","I love eating fish.":"J'adore manger du poisson.",
  "I adore singing.":"J'adore chanter.","I like swimming very much.":"J'aime beaucoup nager.",
  "I like cooking.":"J'aime cuisiner.","I dislike wasting time.":"Je n'aime pas perdre de temps.",
  "I don't like sport at all.":"Je n'aime pas du tout le sport.",
  "He detests being late.":"Il déteste être en retard.",
  "Are you available on the 17th?":"Es-tu disponible le 17 ?",
  "Can we meet on the 16th?":"Peut-on se voir le 16 ?",
  "Are you free next week?":"Es-tu libre la semaine prochaine ?",
  "Yes, Thursday is fine.":"Oui, jeudi c'est parfait.","Thursday would be perfect.":"Jeudi serait parfait.",
  "I feel a bit under the weather.":"Je ne me sens pas très bien.",
  "I'm not feeling very well.":"Je ne me sens pas très bien.",
  "I think I'm going down with a cold.":"Je crois que je couve un rhume.",
  "I've got a slight headache.":"J'ai un léger mal de tête.","I have a touch of flu.":"J'ai un peu la grippe.",
  "You don't look very well.":"Tu n'as pas l'air très bien.",
  "Maybe you should go home and get some rest.":"Tu devrais peut-être rentrer chez toi et te reposer.",
  "Are you free next Thursday?":"Es-tu libre jeudi prochain ?",
  "Would you like to come?":"Voudrais-tu venir ?","I'd love to, thanks.":"Avec plaisir, merci.",
  "That's very kind of you, thanks.":"C'est très gentil de ta part, merci.",
  "That's very kind of you, but I'm doing something else on Saturday.":"C'est très gentil, mais j'ai autre chose de prévu samedi.",
  "Excuse me, I think you've given me the wrong change.":"Excusez-moi, je crois que vous m'avez rendu la mauvaise monnaie.",
  "Excuse me, but there's a problem with the heating in my room.":"Excusez-moi, mais il y a un problème de chauffage dans ma chambre.",
  "Can I help you?":"Puis-je vous aider ?","Shall I open the window for you?":"Voulez-vous que j'ouvre la fenêtre ?",
  "Would you like another coffee?":"Voulez-vous un autre café ?","Yes please.":"Oui, s'il vous plaît.",
  "No, thanks.":"Non, merci.","Could you open the door for me, please?":"Pourriez-vous ouvrir la porte pour moi, s'il vous plaît ?",
  "Can I use your computer, please?":"Puis-je utiliser ton ordinateur, s'il te plaît ?",
  "Could I borrow some money from you, please?":"Pourrais-tu me prêter de l'argent, s'il te plaît ?",
  "I was shocked to hear...":"J'ai été choqué(e) d'apprendre...",
  "The news came as a complete shock.":"La nouvelle a été un choc total.",
  "I just can't believe...":"Je n'arrive pas à croire...",
  "It's unbelievable.":"C'est incroyable.","It's so awful.":"C'est tellement horrible.",
  "It's a tragedy.":"C'est une tragédie.",
};

async function run() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

  // Apply vocab translations
  let vocabCount = 0;
  for (const item of data.vocabulary_items) {
    const fr = VOCAB_FR[item.translation_en];
    if (fr && !item.translation_fr) { item.translation_fr = fr; vocabCount++; }
  }

  // Apply phrase translations
  let phraseCount = 0;
  for (const item of data.phrases) {
    const fr = PHRASES_FR[item.translation_en];
    if (fr && !item.translation_fr) { item.translation_fr = fr; phraseCount++; }
  }

  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`✓ JSON: ${vocabCount} vocab + ${phraseCount} phrases translated`);

  // Supabase upsert
  console.log('Pushing vocab to Supabase…');
  const vocabRows = data.vocabulary_items.filter(v => v.translation_fr).map(v => ({ id: v.id, translation_fr: v.translation_fr }));
  for (let i = 0; i < vocabRows.length; i += 100) {
    const { error } = await supabase.from('vocabulary_items').upsert(vocabRows.slice(i, i + 100), { onConflict: 'id' });
    if (error) console.error('vocab:', error.message); else process.stdout.write('.');
  }

  console.log('\nPushing phrases to Supabase…');
  const phraseRows = data.phrases.filter(p => p.translation_fr).map(p => ({ id: p.id, translation_fr: p.translation_fr }));
  for (let i = 0; i < phraseRows.length; i += 100) {
    const { error } = await supabase.from('phrases').upsert(phraseRows.slice(i, i + 100), { onConflict: 'id' });
    if (error) console.error('phrases:', error.message); else process.stdout.write('.');
  }

  console.log('\n✓ Done');
}

run().catch(err => { console.error(err); process.exit(1); });
