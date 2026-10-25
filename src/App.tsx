import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { AppNavigationHeader, HistoryEntry } from './components/navigation/AppNavigationHeader';
import { GeminiChatbot } from './components/ai/GeminiChatbot';
import { GuestIntroPage } from './pages/GuestIntroPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { QuizEditorPage } from './pages/QuizEditorPage';
import { SoloStudyPage } from './pages/SoloStudyPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { HostGamePage } from './pages/HostGamePage';
import { PlayerGamePage } from './pages/PlayerGamePage';
import { MiniGamesPage } from './pages/MiniGamesPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { Bot } from 'lucide-react';
import { Footer } from './components/layout/Footer';

function MainApp() {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('intro');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-web-dev-01');
  const [initialPin, setInitialPin] = useState<string>('');
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([]);
  const [quizTitles, setQuizTitles] = useState<Record<string, string>>({
    'quiz-web-dev-01': 'Lập trình Web Cơ bản',
    'quiz-science-ai-02': 'Khoa học & Trí tuệ nhân tạo (AI)',
    'quiz-english-comm-03': 'Tiếng Anh Giao tiếp Chuyên ngành',
  });

  // Pre-fetch quiz titles so breadcrumbs display human-readable quiz names
  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const mapping: Record<string, string> = {};
          json.data.forEach((q: any) => {
            if (q.id && q.title) mapping[q.id] = q.title;
          });
          setQuizTitles(prev => ({ ...prev, ...mapping }));
        }
      })
      .catch(console.warn);
  }, []);

  const getTabLabel = (tab: string, extra?: string): string => {
    switch (tab) {
      case 'intro': return 'Trang chủ';
      case 'tinhnang': return 'Tính năng Đột phá';
      case 'dashboard': return 'Bàn học';
      case 'quizzes': return 'Kho Quiz';
      case 'study': return extra && quizTitles[extra] ? `Luyện thi: ${quizTitles[extra]}` : 'Luyện thi Solo';
      case 'flashcards': return extra && quizTitles[extra] ? `Flashcards: ${quizTitles[extra]}` : 'Flashcards';
      case 'host': return extra && quizTitles[extra] ? `Host: ${quizTitles[extra]}` : 'Tạo phòng thi';
      case 'multiplayer': return 'Đấu trường Live';
      case 'minigames': return 'Mini Games';
      case 'create-quiz': return 'Tạo Quiz';
      case 'edit-quiz': return 'Sửa Quiz';
      case 'admin': return 'Quản trị hệ thống';
      case 'login': return 'Đăng nhập';
      default: return tab;
    }
  };

  const handleNavigate = (tab: string, extra?: string) => {
    if (tab === currentTab && (!extra || extra === selectedQuizId)) {
      return;
    }

    // Save previous state to history
    const prevLabel = getTabLabel(currentTab, selectedQuizId);
    setHistoryStack(prev => {
      const last = prev[prev.length - 1];
      if (last && last.tab === currentTab && last.extra === selectedQuizId) {
        return prev;
      }
      return [...prev, { tab: currentTab, extra: selectedQuizId, label: prevLabel }];
    });

    if (tab === 'study' || tab === 'flashcards' || tab === 'host' || tab === 'edit-quiz') {
      if (extra) {
        setSelectedQuizId(extra);
        if (!quizTitles[extra]) {
          fetch(`/api/quizzes/${extra}`)
            .then(res => res.json())
            .then(json => {
              if (json.success && json.data?.title) {
                setQuizTitles(p => ({ ...p, [extra]: json.data.title }));
              }
            })
            .catch(console.warn);
        }
      }
    }
    if (tab === 'multiplayer' && extra) {
      setInitialPin(extra);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (historyStack.length > 0) {
      const nextStack = [...historyStack];
      const prev = nextStack.pop()!;
      setHistoryStack(nextStack);
      if (prev.extra && (prev.tab === 'study' || prev.tab === 'flashcards' || prev.tab === 'host' || prev.tab === 'edit-quiz')) {
        setSelectedQuizId(prev.extra);
      }
      if (prev.extra && prev.tab === 'multiplayer') {
        setInitialPin(prev.extra);
      }
      setCurrentTab(prev.tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback target when history is empty
      const fallbackTab = currentUser ? 'dashboard' : 'intro';
      if (currentTab !== fallbackTab) {
        setCurrentTab(fallbackTab);
      } else if (currentUser) {
        setCurrentTab('intro');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eaf5fc] dark:bg-[#07192d] text-slate-700 dark:text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base font-bold text-sky-900 dark:text-sky-200">Đang tải STUDENT STUDY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-[#eaf5fc] via-[#f1f8fe] to-[#e4f2fb] dark:from-[#07192d] dark:via-[#091f38] dark:to-[#061626] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => handleNavigate(tab)}
        openAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Breadcrumb Bar & Back Action */}
        <AppNavigationHeader
          currentTab={currentTab}
          selectedQuizTitle={quizTitles[selectedQuizId]}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          previousPageLabel={historyStack.length > 0 ? historyStack[historyStack.length - 1].label : undefined}
          hasHistory={historyStack.length > 0}
          openAIChat={() => setIsAIChatOpen(true)}
        />

        {/* 1. Guest Introduction Dashboard */}
        {currentTab === 'intro' && (
          <GuestIntroPage
            onNavigate={handleNavigate}
            openAIChat={() => setIsAIChatOpen(true)}
            onOpenLogin={() => handleNavigate('login')}
            isLoggedIn={!!currentUser}
          />
        )}

        {/* 1b. Dedicated Features Page */}
        {currentTab === 'tinhnang' && (
          <FeaturesPage
            onNavigate={handleNavigate}
            openAIChat={() => setIsAIChatOpen(true)}
            onOpenLogin={() => handleNavigate('login')}
            isLoggedIn={!!currentUser}
          />
        )}

        {/* 2. Login Page */}
        {currentTab === 'login' && (
          <LoginPage onSuccess={() => handleNavigate(currentUser ? 'dashboard' : 'dashboard')} />
        )}

        {/* 3. Student/Teacher Dashboard */}
        {currentTab === 'dashboard' && (
          currentUser ? (
            <DashboardPage
              onNavigate={handleNavigate}
              openAIChat={() => setIsAIChatOpen(true)}
            />
          ) : (
            <LoginPage onSuccess={() => handleNavigate('dashboard')} />
          )
        )}

        {/* 4. Quizzes Page */}
        {currentTab === 'quizzes' && (
          <QuizzesPage onNavigate={handleNavigate} />
        )}

        {/* 5. Create / Edit Quiz */}
        {currentTab === 'create-quiz' && (
          <QuizEditorPage
            onBack={handleGoBack}
            onSaved={() => handleNavigate('quizzes')}
          />
        )}

        {currentTab === 'edit-quiz' && (
          <QuizEditorPage
            quizId={selectedQuizId}
            onBack={handleGoBack}
            onSaved={() => handleNavigate('quizzes')}
          />
        )}

        {/* 6. Solo Study Quiz Practice */}
        {currentTab === 'study' && (
          <SoloStudyPage
            quizId={selectedQuizId}
            onBack={handleGoBack}
            onRequireLogin={() => handleNavigate('login')}
          />
        )}

        {/* 7. Flashcards Page */}
        {currentTab === 'flashcards' && (
          <FlashcardsPage
            quizId={selectedQuizId}
            onBack={handleGoBack}
            onRequireLogin={() => handleNavigate('login')}
          />
        )}

        {/* 8. Host Live Game (Kahoot-style) */}
        {currentTab === 'host' && (
          <HostGamePage
            quizId={selectedQuizId}
            onBack={handleGoBack}
          />
        )}

        {/* 9. Multiplayer Live Player View */}
        {currentTab === 'multiplayer' && (
          <PlayerGamePage
            initialPin={initialPin}
            onBack={handleGoBack}
            onHostQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              handleNavigate('host', quizId);
            }}
            onRequireLogin={() => handleNavigate('login')}
          />
        )}

        {/* 10. Mini Games */}
        {currentTab === 'minigames' && (
          <MiniGamesPage onNavigate={handleNavigate} />
        )}

        {/* 11. Admin Page */}
        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Floating Gemini AI Tutor Widget Toggle */}
      {!isAIChatOpen && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-2xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 font-bold text-base cursor-pointer"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="hidden sm:inline">Hỏi Trợ Giảng AI</span>
        </button>
      )}

      {/* Floating Gemini Chatbot Dialog */}
      <GeminiChatbot
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onRequireLogin={() => {
          setIsAIChatOpen(false);
          handleNavigate('login');
        }}
      />

      {/* Footer with Contact Strip, Support & Disclaimer modaled actions */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
