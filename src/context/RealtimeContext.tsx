import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Comment, CommentReply, ChatMessage, Course, ForumPost, ForumComment } from '../types';
import { notificationService } from '../services/notificationService';
import { sound } from '../services/sound';
import { useAuth } from './AuthContext';
import { coursesApi } from '../services/coursesApi';
import { postsApi } from '../services/postsApi';
import { chatApi } from '../services/chatApi';

interface RealtimeContextType {
  courses: Course[];
  comments: Record<string, Comment[]>;
  chatMessages: ChatMessage[];
  forumPosts: ForumPost[];
  addComment: (courseId: string, content: string) => void;
  addReply: (courseId: string, parentCommentId: string, content: string) => void;
  likeComment: (courseId: string, commentId: string) => void;
  likeCourse: (courseId: string) => void;
  sendChatMessage: (message: string) => void;
  triggerSimulatedPeerActivity: (courseId?: string) => void;
  getCommentsForCourse: (courseId: string) => Comment[];
  isSimulatingActive: boolean;
  setIsSimulatingActive: (active: boolean) => void;
  addForumPost: (post: ForumPost) => void;
  addForumComment: (postId: string, commentText: string, image?: string) => void;
  likeForumPost: (postId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  // Load comments from PostgreSQL / localStorage cache
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('shanhai_realtime_comments');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Chat messages for community drawer
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shanhai_chat_messages');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Forum posts state shared across ForumHomepage, CreatePostModal, and PostEditorPage
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shanhai_forum_posts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSimulatingActive, setIsSimulatingActive] = useState<boolean>(false);

  // Tự động nạp dữ liệu Khóa Học thời gian thực từ PostgreSQL Database qua REST API
  useEffect(() => {
    coursesApi
      .getCourses({ limit: 50 })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setCourses(res.data);
        }
      })
      .catch((err) => {
        console.log('[RealtimeContext] Dùng mock courses khi offline:', err?.message);
      });
  }, []);

  // Tự động nạp dữ liệu Tin Nhắn Chat thời gian thực từ PostgreSQL Database
  useEffect(() => {
    chatApi
      .getMessages()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setChatMessages(res.data);
        }
      })
      .catch((err) => {
        console.log('[RealtimeContext] Chat offline notice:', err?.message);
      });
  }, []);

  // Tự động nạp dữ liệu Bài Viết Diễn Đàn thời gian thực từ PostgreSQL Database qua REST API
  useEffect(() => {
    postsApi
      .getPosts({ limit: 50 })
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          setForumPosts(res.data);
        }
      })
      .catch((err) => {
        console.log('[RealtimeContext] Dùng mock posts khi offline:', err?.message);
      });
  }, []);

  // Sync comments to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shanhai_realtime_comments', JSON.stringify(comments));
      } catch {
        // Ignore
      }
    }
  }, [comments]);

  // Sync chat to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shanhai_chat_messages', JSON.stringify(chatMessages));
      } catch {
        // Ignore
      }
    }
  }, [chatMessages]);

  // Sync forum posts to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shanhai_forum_posts', JSON.stringify(forumPosts));
      } catch {
        // Ignore
      }
    }
  }, [forumPosts]);

  // Cross-tab real-time listener via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('shanhai_events_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_COMMENT') {
          const { courseId, comment } = event.data.payload;
          setComments((prev) => {
            const courseList = prev[courseId] || [];
            return {
              ...prev,
              [courseId]: [comment, ...courseList.filter((c) => c.id !== comment.id)],
            };
          });
          // Update courses count
          setCourses((prev) =>
            prev.map((c) => (c.id === courseId ? { ...c, commentsCount: c.commentsCount + 1 } : c))
          );
        } else if (event.data?.type === 'NEW_CHAT') {
          const { message } = event.data.payload;
          setChatMessages((prev) => [...prev, message]);
        }
      };
    } catch {
      // Ignore
    }

    return () => {
      channel?.close();
    };
  }, []);

  const broadcastEvent = (type: string, payload: unknown) => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('shanhai_events_sync');
      channel.postMessage({ type, payload });
      channel.close();
    } catch {
      // Ignore
    }
  };

  const getCommentsForCourse = useCallback(
    (courseId: string): Comment[] => {
      return comments[courseId] || [];
    },
    [comments]
  );

  const addComment = (courseId: string, content: string) => {
    if (!content.trim()) return;

    const currentAuthor = user || {
      id: 'guest',
      name: 'Khách tham quan (Guest)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      tier: 'free' as const,
    };

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      courseId,
      userId: currentAuthor.id,
      userName: currentAuthor.name,
      userAvatar: currentAuthor.avatar,
      userTier: currentAuthor.tier,
      content: content.trim(),
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      likes: 0,
      replies: [],
    };

    // Update state
    setComments((prev) => ({
      ...prev,
      [courseId]: [newComment, ...(prev[courseId] || [])],
    }));

    // Increment count on course card
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, commentsCount: c.commentsCount + 1 } : c))
    );

    sound.playCommentPop();
    broadcastEvent('NEW_COMMENT', { courseId, comment: newComment });

    // Lưu bình luận vào PostgreSQL Database qua REST API
    coursesApi.addComment(courseId, content.trim()).catch((err) => {
      console.log('[RealtimeContext] Lưu comment vào PostgreSQL notice:', err?.message);
    });

    // Simulate smart interactive peer reply after 4-6 seconds if enabled
    if (isSimulatingActive) {
      setTimeout(() => {
        triggerSimulatedPeerReply(courseId, newComment.id, newComment.userName);
      }, 4500);
    }
  };

  const addReply = (courseId: string, parentCommentId: string, content: string) => {
    if (!content.trim()) return;

    const currentAuthor = user || {
      id: 'guest',
      name: 'Khách tham quan',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      tier: 'free' as const,
    };

    const newReply: CommentReply = {
      id: `reply_${Date.now()}`,
      userId: currentAuthor.id,
      userName: currentAuthor.name,
      userAvatar: currentAuthor.avatar,
      userTier: currentAuthor.tier,
      content: content.trim(),
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      likes: 0,
    };

    setComments((prev) => {
      const list = prev[courseId] || [];
      const updated = list.map((item) => {
        if (item.id === parentCommentId) {
          return {
            ...item,
            replies: [...(item.replies || []), newReply],
          };
        }
        return item;
      });
      return { ...prev, [courseId]: updated };
    });

    sound.playCommentPop();

    // Lưu phản hồi vào PostgreSQL Database
    coursesApi.addReply(courseId, parentCommentId, content.trim()).catch((err) => {
      console.log('[RealtimeContext] Lưu reply vào PostgreSQL notice:', err?.message);
    });

    // Trigger push notification to other users
    notificationService.sendPushNotification({
      type: 'comment',
      title: '💬 Phản hồi bình luận mới',
      message: `${currentAuthor.name} vừa trả lời trong luồng thảo luận của khóa học.`,
      timestamp: 'Vừa xong',
      courseId,
    });
  };

  const likeComment = (courseId: string, commentId: string) => {
    sound.playClick();
    setComments((prev) => {
      const list = prev[courseId] || [];
      const updated = list.map((item) => {
        if (item.id === commentId) {
          const liked = !item.hasLiked;
          return {
            ...item,
            likes: liked ? item.likes + 1 : item.likes - 1,
            hasLiked: liked,
          };
        }
        return item;
      });
      return { ...prev, [courseId]: updated };
    });
  };

  const likeCourse = (courseId: string) => {
    sound.playClick();
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          return {
            ...c,
            likesCount: c.likesCount + 1,
          };
        }
        return c;
      })
    );
    // Ghi nhận lượt thích vào PostgreSQL Database
    coursesApi.likeCourse(courseId).catch(() => {});
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const currentAuthor = user || {
      id: 'guest',
      name: 'Khách',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      tier: 'free' as const,
    };

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      userId: currentAuthor.id,
      userName: currentAuthor.name,
      userAvatar: currentAuthor.avatar,
      userTier: currentAuthor.tier,
      message: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    sound.playCommentPop();
    broadcastEvent('NEW_CHAT', { message: newMsg });

    // Lưu tin nhắn chat vào PostgreSQL Database
    chatApi.sendMessage(text.trim()).catch((err) => {
      console.log('[RealtimeContext] Lưu chat vào PostgreSQL notice:', err?.message);
    });
  };

  // Automated simulated peer responses to make the demo lively & prove real-time mechanics
  const triggerSimulatedPeerReply = (courseId: string, commentId: string, targetName: string) => {
    const peers = [
      {
        name: 'Trương Nhất Minh (CGI Artist)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        tier: 'supreme' as const,
        msg: `@${targetName} Chuẩn luôn bạn ơi! Phần setup thông số ánh sáng ban đêm trong bài giảng này áp dụng thực tế rất hiệu quả.`,
      },
      {
        name: 'Âu Dương Kỳ (Colorist)',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
        tier: 'gold' as const,
        msg: `@${targetName} Đã thử tải file project về mở trong DaVinci Resolve 19, chạy mượt và phân lớp node cực kỳ khoa học!`,
      },
    ];

    const chosen = peers[Math.floor(Math.random() * peers.length)];

    const peerReply: CommentReply = {
      id: `reply_sim_${Date.now()}`,
      userId: 'peer_sim',
      userName: chosen.name,
      userAvatar: chosen.avatar,
      userTier: chosen.tier,
      content: chosen.msg,
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      likes: 1,
    };

    setComments((prev) => {
      const list = prev[courseId] || [];
      const updated = list.map((item) => {
        if (item.id === commentId) {
          return {
            ...item,
            replies: [...(item.replies || []), peerReply],
          };
        }
        return item;
      });
      return { ...prev, [courseId]: updated };
    });

    // Send push notification
    notificationService.sendPushNotification({
      type: 'comment',
      title: `💬 ${chosen.name} vừa nhắc đến bạn!`,
      message: chosen.msg,
      timestamp: 'Vừa xong',
      courseId,
    });
  };

  const triggerSimulatedPeerActivity = (targetCourseId?: string) => {
    const cId = targetCourseId || 'course-480';
    const fakePeers = [
      {
        name: 'Vương Gia Vĩ',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        tier: 'supreme' as const,
        content: 'Vừa tham gia đợt mua chung này xong! Tốc độ mở khóa tài nguyên nhanh như chớp. Anh em vào gom sớm nhé.',
      },
      {
        name: 'Chu Mộng Vũ',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        tier: 'gold' as const,
        content: 'Bác nào có bộ LUT đi kèm cho máy quay Fuji XT-5 cho mình xin kinh nghiệm test với tông màu khói nhang với!',
      }
    ];

    const pick = fakePeers[Math.floor(Math.random() * fakePeers.length)];
    const newSimComment: Comment = {
      id: `comment_sim_${Date.now()}`,
      courseId: cId,
      userId: `peer_${Date.now()}`,
      userName: pick.name,
      userAvatar: pick.avatar,
      userTier: pick.tier,
      content: pick.content,
      timestamp: 'Vừa xong',
      createdAt: Date.now(),
      likes: 2,
      replies: [],
    };

    setComments((prev) => ({
      ...prev,
      [cId]: [newSimComment, ...(prev[cId] || [])],
    }));

    setCourses((prev) =>
      prev.map((c) => (c.id === cId ? { ...c, commentsCount: c.commentsCount + 1 } : c))
    );

    notificationService.sendPushNotification({
      type: 'comment',
      title: `⚡ Bình luận thời gian thực mới từ ${pick.name}`,
      message: pick.content,
      timestamp: 'Vừa xong',
      courseId: cId,
    });
  };

  const addForumPost = useCallback(async (newPost: ForumPost) => {
    setForumPosts((prev) => [newPost, ...prev]);
    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'comment',
      title: '🎉 Bài viết thảo luận mới!',
      message: `Tác giả ${newPost.authorName} vừa đăng "${newPost.title}"`,
      timestamp: 'Vừa xong',
    });

    // Lưu bài viết trực tiếp vào Database PostgreSQL qua REST API
    try {
      await postsApi.createPost({
        boardId: newPost.boardId || 'board-inspiration',
        title: newPost.title,
        content: newPost.content,
        coverImageUrl: newPost.images?.[0],
      });
    } catch (err: any) {
      console.log('[RealtimeContext] Ghi bài viết vào PostgreSQL notice:', err?.message);
    }
  }, []);

  const addForumComment = useCallback((postId: string, commentText: string, image?: string) => {
    if (!commentText.trim() && !image) return;

    const newComment: ForumComment = {
      id: `fcomm_${Date.now()}`,
      authorId: user?.id || 'guest',
      authorName: user?.name || 'Đồng môn ẩn danh',
      authorAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
      authorTier: user?.tier || 'free',
      text: commentText.trim(),
      image: image || undefined,
      timeAgo: 'Vừa xong',
      likes: 0,
    };

    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updatedComments = [newComment, ...(p.commentsList || [])];
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            commentsList: updatedComments,
          };
        }
        return p;
      })
    );

    sound.playSuccess();
    notificationService.sendPushNotification({
      type: 'comment',
      title: '💬 Phản hồi thảo luận mới!',
      message: `${user?.name || 'Một thành viên'} vừa bình luận vào bài viết trên Diễn Đàn.`,
      timestamp: 'Vừa xong',
    });
  }, [user]);

  const likeForumPost = useCallback((postId: string) => {
    setForumPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, likesCount: p.likesCount + 1 };
        }
        return p;
      })
    );
    sound.playClick();
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        courses,
        comments,
        chatMessages,
        forumPosts,
        addComment,
        addReply,
        likeComment,
        likeCourse,
        sendChatMessage,
        triggerSimulatedPeerActivity,
        getCommentsForCourse,
        isSimulatingActive,
        setIsSimulatingActive,
        addForumPost,
        addForumComment,
        likeForumPost,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
