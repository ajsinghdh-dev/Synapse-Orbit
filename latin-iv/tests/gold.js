// HAND-TYPED reference paradigms. These are deliberately written out in full and independently of
// the engine: tests compare engine output against them, so an error in either shows up.
export const GOLD_VERBS = {
  amo: { ind: ['amō', 'amās', 'amat', 'amāmus', 'amātis', 'amant'], inf: 'amāre', impSg: 'amā', impPl: 'amāte' },
  laudo: { ind: ['laudō', 'laudās', 'laudat', 'laudāmus', 'laudātis', 'laudant'], inf: 'laudāre', impSg: 'laudā', impPl: 'laudāte' },
  do: { ind: ['dō', 'dās', 'dat', 'damus', 'datis', 'dant'], inf: 'dare', impSg: 'dā', impPl: 'date' },
  moneo: { ind: ['moneō', 'monēs', 'monet', 'monēmus', 'monētis', 'monent'], inf: 'monēre', impSg: 'monē', impPl: 'monēte' },
  video: { ind: ['videō', 'vidēs', 'videt', 'vidēmus', 'vidētis', 'vident'], inf: 'vidēre', impSg: 'vidē', impPl: 'vidēte' },
  debeo: { ind: ['dēbeō', 'dēbēs', 'dēbet', 'dēbēmus', 'dēbētis', 'dēbent'], inf: 'dēbēre', impSg: 'dēbē', impPl: 'dēbēte' },
  sedeo: { ind: ['sedeō', 'sedēs', 'sedet', 'sedēmus', 'sedētis', 'sedent'], inf: 'sedēre', impSg: 'sedē', impPl: 'sedēte' },
  sum: { ind: ['sum', 'es', 'est', 'sumus', 'estis', 'sunt'], inf: 'esse' },
};
const T = (sg, pl) => ({ sg, pl }); // [nom, gen, dat, acc, abl, voc]
export const GOLD_NOUNS = {
  puella: T(['puella', 'puellae', 'puellae', 'puellam', 'puellā', 'puella'], ['puellae', 'puellārum', 'puellīs', 'puellās', 'puellīs', 'puellae']),
  agricola: T(['agricola', 'agricolae', 'agricolae', 'agricolam', 'agricolā', 'agricola'], ['agricolae', 'agricolārum', 'agricolīs', 'agricolās', 'agricolīs', 'agricolae']),
  poeta: T(['poēta', 'poētae', 'poētae', 'poētam', 'poētā', 'poēta'], ['poētae', 'poētārum', 'poētīs', 'poētās', 'poētīs', 'poētae']),
  dominus: T(['dominus', 'dominī', 'dominō', 'dominum', 'dominō', 'domine'], ['dominī', 'dominōrum', 'dominīs', 'dominōs', 'dominīs', 'dominī']),
  servus: T(['servus', 'servī', 'servō', 'servum', 'servō', 'serve'], ['servī', 'servōrum', 'servīs', 'servōs', 'servīs', 'servī']),
  puer: T(['puer', 'puerī', 'puerō', 'puerum', 'puerō', 'puer'], ['puerī', 'puerōrum', 'puerīs', 'puerōs', 'puerīs', 'puerī']),
  ager: T(['ager', 'agrī', 'agrō', 'agrum', 'agrō', 'ager'], ['agrī', 'agrōrum', 'agrīs', 'agrōs', 'agrīs', 'agrī']),
  magister: T(['magister', 'magistrī', 'magistrō', 'magistrum', 'magistrō', 'magister'], ['magistrī', 'magistrōrum', 'magistrīs', 'magistrōs', 'magistrīs', 'magistrī']),
  vir: T(['vir', 'virī', 'virō', 'virum', 'virō', 'vir'], ['virī', 'virōrum', 'virīs', 'virōs', 'virīs', 'virī']),
  liber: T(['liber', 'librī', 'librō', 'librum', 'librō', 'liber'], ['librī', 'librōrum', 'librīs', 'librōs', 'librīs', 'librī']),
  filius: T(['fīlius', 'fīlī', 'fīliō', 'fīlium', 'fīliō', 'fīlī'], ['fīliī', 'fīliōrum', 'fīliīs', 'fīliōs', 'fīliīs', 'fīliī']),
  bellum: T(['bellum', 'bellī', 'bellō', 'bellum', 'bellō', 'bellum'], ['bella', 'bellōrum', 'bellīs', 'bella', 'bellīs', 'bella']),
  donum: T(['dōnum', 'dōnī', 'dōnō', 'dōnum', 'dōnō', 'dōnum'], ['dōna', 'dōnōrum', 'dōnīs', 'dōna', 'dōnīs', 'dōna']),
  templum: T(['templum', 'templī', 'templō', 'templum', 'templō', 'templum'], ['templa', 'templōrum', 'templīs', 'templa', 'templīs', 'templa']),
  oppidum: T(['oppidum', 'oppidī', 'oppidō', 'oppidum', 'oppidō', 'oppidum'], ['oppida', 'oppidōrum', 'oppidīs', 'oppida', 'oppidīs', 'oppida']),
  praemium: T(['praemium', 'praemiī', 'praemiō', 'praemium', 'praemiō', 'praemium'], ['praemia', 'praemiōrum', 'praemiīs', 'praemia', 'praemiīs', 'praemia']),
};
// Adjectives: m / f / n paradigms in [nom,gen,dat,acc,abl,voc]
export const GOLD_ADJ = {
  bonus: {
    m: T(['bonus', 'bonī', 'bonō', 'bonum', 'bonō', 'bone'], ['bonī', 'bonōrum', 'bonīs', 'bonōs', 'bonīs', 'bonī']),
    f: T(['bona', 'bonae', 'bonae', 'bonam', 'bonā', 'bona'], ['bonae', 'bonārum', 'bonīs', 'bonās', 'bonīs', 'bonae']),
    n: T(['bonum', 'bonī', 'bonō', 'bonum', 'bonō', 'bonum'], ['bona', 'bonōrum', 'bonīs', 'bona', 'bonīs', 'bona']),
  },
  pulcher: {
    m: T(['pulcher', 'pulchrī', 'pulchrō', 'pulchrum', 'pulchrō', 'pulcher'], ['pulchrī', 'pulchrōrum', 'pulchrīs', 'pulchrōs', 'pulchrīs', 'pulchrī']),
    f: T(['pulchra', 'pulchrae', 'pulchrae', 'pulchram', 'pulchrā', 'pulchra'], ['pulchrae', 'pulchrārum', 'pulchrīs', 'pulchrās', 'pulchrīs', 'pulchrae']),
    n: T(['pulchrum', 'pulchrī', 'pulchrō', 'pulchrum', 'pulchrō', 'pulchrum'], ['pulchra', 'pulchrōrum', 'pulchrīs', 'pulchra', 'pulchrīs', 'pulchra']),
  },
  miser: {
    m: T(['miser', 'miserī', 'miserō', 'miserum', 'miserō', 'miser'], ['miserī', 'miserōrum', 'miserīs', 'miserōs', 'miserīs', 'miserī']),
    f: T(['misera', 'miserae', 'miserae', 'miseram', 'miserā', 'misera'], ['miserae', 'miserārum', 'miserīs', 'miserās', 'miserīs', 'miserae']),
    n: T(['miserum', 'miserī', 'miserō', 'miserum', 'miserō', 'miserum'], ['misera', 'miserōrum', 'miserīs', 'misera', 'miserīs', 'misera']),
  },
};
