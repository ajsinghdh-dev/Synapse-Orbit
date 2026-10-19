// HAND-TYPED reference paradigms. These are deliberately written out in full and independently of
// the engine: tests compare engine output against them, so an error in either shows up.
export const GOLD_VERBS = {
  amo: { ind: ['amō', 'amās', 'amat', 'amāmus', 'amātis', 'amant'], inf: 'amāre', impSg: 'amā', impPl: 'amāte' },
  laudo: { ind: ['laudō', 'laudās', 'laudat', 'laudāmus', 'laudātis', 'laudant'], inf: 'laudāre', impSg: 'laudā', impPl: 'laudāte' },
  do: { ind: ['dō', 'dās', 'dat', 'damus', 'datis', 'dant'], inf: 'dare', impSg: 'dā', impPl: 'date' },
  moneo: { ind: ['moneō', 'monēs', 'monet', 'monēmus', 'monētis', 'monent'], inf: 'monēre', impSg: 'monē', impPl: 'monēte' },
  video: { ind: ['videō', 'vidēs', 'videt', 'vidēmus', 'vidētis', 'vident'], inf: 'vidēre', impSg: 'vidē', impPl: 'vidēte' },
  debeo: { ind: ['dēbeō', 'dēbēs', 'dēbet', 'dēbēmus', 'dēbētis', 'dēbent'], inf: 'dēbēre', impSg: 'dēbē', impPl: 'dēbēte' },
  terreo: { ind: ['terreō', 'terrēs', 'terret', 'terrēmus', 'terrētis', 'terrent'], inf: 'terrēre', impSg: 'terrē', impPl: 'terrēte' },
  iuvo: { ind: ['iuvō', 'iuvās', 'iuvat', 'iuvāmus', 'iuvātis', 'iuvant'], inf: 'iuvāre', impSg: 'iuvā', impPl: 'iuvāte' },
  sum: { ind: ['sum', 'es', 'est', 'sumus', 'estis', 'sunt'], inf: 'esse' },
};
const T = (sg, pl) => ({ sg, pl }); // [nom, gen, dat, acc, abl, voc]
export const GOLD_NOUNS = {
  puella: T(['puella', 'puellae', 'puellae', 'puellam', 'puellā', 'puella'], ['puellae', 'puellārum', 'puellīs', 'puellās', 'puellīs', 'puellae']),
  agricola: T(['agricola', 'agricolae', 'agricolae', 'agricolam', 'agricolā', 'agricola'], ['agricolae', 'agricolārum', 'agricolīs', 'agricolās', 'agricolīs', 'agricolae']),
  poeta: T(['poēta', 'poētae', 'poētae', 'poētam', 'poētā', 'poēta'], ['poētae', 'poētārum', 'poētīs', 'poētās', 'poētīs', 'poētae']),
  puer: T(['puer', 'puerī', 'puerō', 'puerum', 'puerō', 'puer'], ['puerī', 'puerōrum', 'puerīs', 'puerōs', 'puerīs', 'puerī']),
  ager: T(['ager', 'agrī', 'agrō', 'agrum', 'agrō', 'ager'], ['agrī', 'agrōrum', 'agrīs', 'agrōs', 'agrīs', 'agrī']),
  magister: T(['magister', 'magistrī', 'magistrō', 'magistrum', 'magistrō', 'magister'], ['magistrī', 'magistrōrum', 'magistrīs', 'magistrōs', 'magistrīs', 'magistrī']),
  vir: T(['vir', 'virī', 'virō', 'virum', 'virō', 'vir'], ['virī', 'virōrum', 'virīs', 'virōs', 'virīs', 'virī']),
  filius: T(['fīlius', 'fīliī', 'fīliō', 'fīlium', 'fīliō', 'fīlī'], ['fīliī', 'fīliōrum', 'fīliīs', 'fīliōs', 'fīliīs', 'fīliī']),
  bellum: T(['bellum', 'bellī', 'bellō', 'bellum', 'bellō', 'bellum'], ['bella', 'bellōrum', 'bellīs', 'bella', 'bellīs', 'bella']),
  donum: T(['dōnum', 'dōnī', 'dōnō', 'dōnum', 'dōnō', 'dōnum'], ['dōna', 'dōnōrum', 'dōnīs', 'dōna', 'dōnīs', 'dōna']),
  amicus: T(['amīcus', 'amīcī', 'amīcō', 'amīcum', 'amīcō', 'amīce'], ['amīcī', 'amīcōrum', 'amīcīs', 'amīcōs', 'amīcīs', 'amīcī']),
  consilium: T(['cōnsilium', 'cōnsiliī', 'cōnsiliō', 'cōnsilium', 'cōnsiliō', 'cōnsilium'], ['cōnsilia', 'cōnsiliōrum', 'cōnsiliīs', 'cōnsilia', 'cōnsiliīs', 'cōnsilia']),
  filia: T(['fīlia', 'fīliae', 'fīliae', 'fīliam', 'fīliā', 'fīlia'], ['fīliae', 'fīliārum', 'fīliīs', 'fīliās', 'fīliīs', 'fīliae']),
};
// Adjectives: m / f / n paradigms in [nom,gen,dat,acc,abl,voc]
export const GOLD_ADJ = {
  bonus: {
    m: T(['bonus', 'bonī', 'bonō', 'bonum', 'bonō', 'bone'], ['bonī', 'bonōrum', 'bonīs', 'bonōs', 'bonīs', 'bonī']),
    f: T(['bona', 'bonae', 'bonae', 'bonam', 'bonā', 'bona'], ['bonae', 'bonārum', 'bonīs', 'bonās', 'bonīs', 'bonae']),
    n: T(['bonum', 'bonī', 'bonō', 'bonum', 'bonō', 'bonum'], ['bona', 'bonōrum', 'bonīs', 'bona', 'bonīs', 'bona']),
  },
  meus: {
    m: T(['meus', 'meī', 'meō', 'meum', 'meō', 'mī'], ['meī', 'meōrum', 'meīs', 'meōs', 'meīs', 'meī']),
    f: T(['mea', 'meae', 'meae', 'meam', 'meā', 'mea'], ['meae', 'meārum', 'meīs', 'meās', 'meīs', 'meae']),
    n: T(['meum', 'meī', 'meō', 'meum', 'meō', 'meum'], ['mea', 'meōrum', 'meīs', 'mea', 'meīs', 'mea']),
  },
};
