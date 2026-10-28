export type MembershipTier = 'free' | 'gold' | 'supreme' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: MembershipTier;
  credits: number;
  purchasedCourseIds: string[];
  wishlistCourseIds: string[];
  roleBadge?: string;
  joinedDate: string;
  points?: number;
  balance?: number;
  bio?: string;
  heat?: number;
  stats?: UserStats;
  dailyCheckedIn?: boolean;
  googleEmail?: string;
  role?: 'USER' | 'INSTRUCTOR' | 'ADMIN';
  isActive?: boolean;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTier: MembershipTier;
  content: string;
  timestamp: string;
  createdAt: number;
  likes: number;
  hasLiked?: boolean;
}

export interface Comment {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTier: MembershipTier;
  content: string;
  timestamp: string;
  createdAt: number;
  likes: number;
  hasLiked?: boolean;
  replies?: CommentReply[];
}

export interface Course {
  id: string;
  code: string; // e.g. "[480]"
  title: string;
  titleZh: string;
  subtitle: string;
  category: string;
  instructor: string;
  instructorRole: string;
  thumbnail: string;
  eventDate?: string;
  isFree?: boolean;
  originalUrl?: string;
  priceVnd?: number;
  originalPrice: number;
  goldPrice: number;
  supremePrice: number;
  commentsCount: number;
  viewsCount: number;
  likesCount: number;
  publishedTimeAgo: string;
  authorAvatar: string;
  description: string;
  tags: string[];
  groupBuyStatus?: {
    currentMembers: number;
    targetMembers: number;
    hoursLeft: number;
    isCompleted: boolean;
  };
  chapters?: {
    id: string;
    title: string;
    duration: string;
    isFreePreview?: boolean;
  }[];
}

export interface ForumBoard {
  id: string;
  title: string;
  description: string;
  iconType: 'inspiration' | 'asset' | 'need_tutorial' | 'have_tutorial' | 'study';
  postsCount: number;
  heatCount: number;
  likesCount?: number;
  isLocked?: boolean;
  hasFlameBadge?: boolean;
}

export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTier?: MembershipTier;
  text: string;
  image?: string;
  timeAgo: string;
  likes?: number;
}

export interface ForumPost {
  id: string;
  boardId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string;
  authorTier?: MembershipTier;
  updatedTimeAgo: string;
  readsCount: number;
  likesCount: number;
  commentsCount: number;
  title: string;
  content: string;
  images?: string[];
  tags: string[];
  category: 'attention' | 'summary' | 'section' | 'popular' | 'essence' | 'qa' | 'voting';
  isFollowed?: boolean;
  commentsList?: ForumComment[];
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  moderationStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  moderationBadge?: string;
  author?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  viewsCount?: number;
}

export type NotificationType = 'comment' | 'group_buy' | 'system' | 'vip' | 'credit';

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  read: boolean;
  courseId?: string;
  linkText?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTier: MembershipTier;
  message: string;
  timestamp: string;
  createdAt: number;
  isAnnouncement?: boolean;
}

export type Language = 'zh-CN' | 'zh-TW' | 'en' | 'fr' | 'it' | 'de' | 'ru' | 'vi';

export interface UserStats {
  comments: number;
  articles: number;
  posts: number;
  heat: number;
  collections: number;
  fans: number;
}

export interface ReleaseDraft {
  id?: string;
  coverUrl?: string;
  videoUrl?: string;
  title: string;
  content: string;
  readingPermission: 'public' | 'gold' | 'supreme' | 'password';
  section: string;
  topic: string;
  tags: string[];
  releaseType: 'standard' | 'qa';
  isVotingEnabled: boolean;
  pollOptions: string[];
  createdAt?: number;
}
