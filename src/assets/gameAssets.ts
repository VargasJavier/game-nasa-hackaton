import farmer from './icons/farmer.png'
import farmerInvert from './icons/farmerInvert.png'
import farmerWalk from './icons/farmerWalk.gif'
import farmerWalkInvert from './icons/farmerWalkInvert.gif'
import tree from './icons/JungleTree.png'
import texture1 from "./icons/WoodTexture1.png"
import texture2 from "./icons/WoodTexture2.png"
import texture3 from "./icons/FarmLandOnTopvariant1.png"
import texture4 from "./icons/FarmLandOnTopvariant2.png"
import texture5 from "./icons/FarmLandOnTopvariant1.png"
import texture6 from "./icons/FarmLandOnTopvariant2.png"
import riverImg from './icons/river.webp'
import lowerRiverImg from './icons/lowerRiiver.webp'
import dryRiverImg from './icons/dryRiiver.webp'
import laLibertadMap from './icons/laLibertad.png'
import stageIrrigate from "./icons/WoodTexture2.png" // placeholder for irrigate image

const ASSETS = {
  riverImg: riverImg,
  lowerRiverImg: lowerRiverImg,
  dryRiverImg: dryRiverImg,
  farmer: farmer,
  farmerInvert: farmerInvert,
  farmerWalk: farmerWalk,
  farmerWalkInvert: farmerWalkInvert,
  laLibertadMap: laLibertadMap,
  tree: tree,
  plotStages: [
    texture1, // tierra
    texture2, // brote
    texture3, // pequeño
    texture4, // medio
    texture5, // maduro
    texture6, // dorado/cosecha
  ],
  stageIrrigate: stageIrrigate, // imagen para cuando la parcela está regada
};

export default ASSETS;