// Generated event photography (gpt-image-2): scenes and silhouettes only, no identifiable people.
import wedding from '../assets/images/wedding.jpg';
import sangeet from '../assets/images/sangeet.jpg';
import corporate from '../assets/images/corporate.jpg';
import fest from '../assets/images/fest.jpg';
import party from '../assets/images/party.jpg';
import destination from '../assets/images/destination.jpg';
import transport from '../assets/images/transport.jpg';
import security from '../assets/images/security.jpg';

export const scenes = { wedding, sangeet, corporate, fest, party, destination, transport, security } as const;
export type SceneKey = keyof typeof scenes;
