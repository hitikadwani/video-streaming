export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Video {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  manifest_url: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  tags?: Tag[];
}
