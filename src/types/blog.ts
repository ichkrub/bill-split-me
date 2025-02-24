export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  image_url?: string;
  created_at: string;
  excerpt?: string;
}