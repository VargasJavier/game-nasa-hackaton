import farmer from '../assets/icons/farmer.png'
import farmerInvert from '../assets/icons/farmerInvert.png'
import tree from '../assets/icons/JungleTree.png'
import texture1 from "../assets/icons/WoodTexture1.png"
import texture2 from "../assets/icons/WoodTexture2.png"
import texture3 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture4 from "../assets/icons/FarmLandOnTopvariant2.png"
import texture5 from "../assets/icons/FarmLandOnTopvariant1.png"
import texture6 from "../assets/icons/FarmLandOnTopvariant2.png"
import stageIrrigate from "../assets/icons/WoodTexture2.png" // placeholder for irrigate image

const ASSETS = {
  farmerIdle: farmer,
  farmerIdleInvert: farmerInvert,
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