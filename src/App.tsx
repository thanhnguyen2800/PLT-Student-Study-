import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { GeminiChatbot } from './components/ai/GeminiChatbot';
import { GuestIntroPage } from './pages/GuestIntroPage';
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
import { Sparkles, Bot } from 'lucide-react';
import { PltLogo } from './components/common/PltLogo';

function MainApp() {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('intro');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-web-dev-01');
  const [initialPin, setInitialPin] = useState<string>('');
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  const handleNavigate = (tab: string, extra?: string) => {
    if (tab === 'study' || tab === 'flashcards' || tab === 'host' || tab === 'edit-quiz') {
      if (extra) setSelectedQuizId(extra);
    }
    if (tab === 'multiplayer' && extra) {
      setInitialPin(extra);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Top Navigation - Matching image.png */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAIChat={() => setIsAIChatOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* 1. Guest Introduction Dashboard (Default when clicking link) */}
        {currentTab === 'intro' && (
          <GuestIntroPage
            onNavigate={handleNavigate}
            openAIChat={() => setIsAIChatOpen(true)}
            onOpenLogin={() => setCurrentTab('login')}
            isLoggedIn={!!currentUser}
          />
        )}

        {/* 2. Login Page */}
        {currentTab === 'login' && (
          <LoginPage onSuccess={() => setCurrentTab('dashboard')} />
        )}

        {/* 3. Student/Teacher Dashboard */}
        {currentTab === 'dashboard' && (
          currentUser ? (
            <DashboardPage
              onNavigate={handleNavigate}
              openAIChat={() => setIsAIChatOpen(true)}
            />
          ) : (
            <LoginPage onSuccess={() => setCurrentTab('dashboard')} />
          )
        )}

        {/* 4. Quizzes Page */}
        {currentTab === 'quizzes' && (
          <QuizzesPage onNavigate={handleNavigate} />
        )}

        {/* 5. Create / Edit Quiz */}
        {currentTab === 'create-quiz' && (
          <QuizEditorPage
            onBack={() => setCurrentTab('quizzes')}
            onSaved={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'edit-quiz' && (
          <QuizEditorPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
            onSaved={() => setCurrentTab('quizzes')}
          />
        )}

        {/* 6. Solo Study Quiz Practice */}
        {currentTab === 'study' && (
          <SoloStudyPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
            onRequireLogin={() => setCurrentTab('login')}
          />
        )}

        {/* 7. Flashcards Page */}
        {currentTab === 'flashcards' && (
          <FlashcardsPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
            onRequireLogin={() => setCurrentTab('login')}
          />
        )}

        {/* 8. Host Live Game (Kahoot-style) */}
        {currentTab === 'host' && (
          <HostGamePage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
          />
        )}

        {/* 9. Multiplayer Live Player View */}
        {currentTab === 'multiplayer' && (
          <PlayerGamePage
            initialPin={initialPin}
            onBack={() => setCurrentTab(currentUser ? 'dashboard' : 'intro')}
            onHostQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              setCurrentTab('host');
            }}
            onRequireLogin={() => setCurrentTab('login')}
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
          setCurrentTab('login');
        }}
      />

      {/* Footer - Enlarged, clean & modern */}
      <footer className="mt-auto border-t border-sky-200/70 dark:border-sky-900/40 bg-white/80 dark:bg-[#07192d]/85 backdrop-blur-md py-8 text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PltLogo size="sm" />
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
              STUDENT STUDY
            </span>
          </div>
          <p className="text-sm text-center sm:text-right">
            © {new Date().getFullYear()} STUDENT STUDY by PLT SOLUTIONS. Nền tảng học tập & ôn luyện kiến thức thế hệ mới.
          </p>
        </div>
      </footer>
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
