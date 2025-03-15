export interface Business {
  id?: string;
  name: string;
  address: string;
  description: string;
  email: string;
  location: string;
  instagramUrl: string;
}

export interface Profile {
  id?: string;
  username: string;
  email: string;
  profile_photo_url?: string;
}

export interface Creator {
  id?: string;
  name: string;
  description: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  location: string;
  languages: string[];
}
