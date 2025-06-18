export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  description?: string
  image_url: string
  created_at: string
  profiles?: Profile
  likes?: Like[]
  comments?: Comment[]
  is_liked?: boolean
  is_pinned?: boolean
  likes_count?: number
  comments_count?: number
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Pin {
  id: string
  user_id: string
  post_id: string
  created_at: string
}
