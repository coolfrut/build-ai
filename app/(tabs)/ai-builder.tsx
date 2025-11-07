import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OpenAIService, ChatMessage } from '../../utils/openAIService';
import { useLocalSearchParams } from 'expo-router';

interface Message {
  id: string;
  text: string;
  time: string;
  isUser: boolean;
}

// Animated typing dots component
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  const dotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingDotsContainer}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
};

export default function AIBuilderScreen() {
  const { autoMessage } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatTime, setChatTime] = useState('00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickQuestions = [
    'What foods are high in protein?',
    'How to calculate calories for weight loss?',
    'What to eat before a workout?',
    'Create a meal plan for the day',
  ];

  // Helper function to add message to chat history
  const addToChatHistory = (role: 'user' | 'assistant', content: string) => {
    setChatHistory(prev => [...prev, { role, content }]);
  };

  // Timer for chat duration
  useEffect(() => {
    if (chatStarted) {
      const interval = setInterval(() => {
        setChatTime(prevTime => {
          const [minutes, seconds] = prevTime.split(':').slice(1).map(Number);
          const totalSeconds = minutes * 60 + seconds + 1;
          const newMinutes = Math.floor(totalSeconds / 60);
          const newSeconds = totalSeconds % 60;
          return `00:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [chatStarted]);

  // Handle auto message from scanner
  useEffect(() => {
    if (autoMessage && typeof autoMessage === 'string') {
      // Start chat if not started
      if (!chatStarted) {
        setChatStarted(true);
      }
      
      // Set message and send it
      setMessage(autoMessage);
      setTimeout(() => {
        sendMessage(autoMessage);
      }, 100);
    }
  }, [autoMessage]);

  const startChat = () => {
    setChatStarted(true);
  };

  const endChat = () => {
    setChatStarted(false);
    setMessages([]);
    setChatHistory([]);
    setChatTime('00:00:00');
    setSuggestions([]);
  };

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || message;
    if (messageToSend.trim() && !isLoading) {
      const userMessage = messageToSend.trim();
      if (!customMessage) {
        setMessage('');
      }

      // Add user message to UI
      const newUserMessage: Message = {
        id: Date.now().toString(),
        text: userMessage,
        time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isUser: true
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      // Add to chat history for AI context
      addToChatHistory('user', userMessage);
      
      if (!chatStarted) {
        startChat();
      }

      // Set loading state
      setIsLoading(true);

      try {
        // Get AI response using the service
        const { response: aiResponse, suggestions: newSuggestions } = await OpenAIService.getBuildingAdvice(
          userMessage, 
          chatHistory
        );
        
        // Add AI message to UI
        const newAIMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          time: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isUser: false
        };
        
        setMessages(prev => [...prev, newAIMessage]);
        
        // Add to chat history and update suggestions
        addToChatHistory('assistant', aiResponse);
        setSuggestions(newSuggestions);
        
        // Scroll to bottom after AI response
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
      } catch (error) {
        let errorMessage = 'Failed to get AI response. Please try again.';
        
        if (error instanceof Error) {
          if (error.message.includes('429')) {
            errorMessage = 'AI request limit exceeded. Please try again in a few seconds.';
          } else if (error.message.includes('401')) {
            errorMessage = 'API authorization error. Please check access key.';
          } else if (error.message.includes('500')) {
            errorMessage = 'AI server temporarily unavailable. Please try later.';
          }
        }
        
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickQuestion = async (question: string) => {
    if (isLoading) return;

    // Add user message to UI
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: question,
      time: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isUser: true
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Add to chat history for AI context
    addToChatHistory('user', question);
    
    if (!chatStarted) {
      startChat();
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Get AI response using the service
      const { response: aiResponse, suggestions: newSuggestions } = await OpenAIService.getBuildingAdvice(
        question, 
        chatHistory
      );
      
      // Add AI message to UI
      const newAIMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isUser: false
      };
      
      setMessages(prev => [...prev, newAIMessage]);
      
      // Add to chat history and update suggestions
      addToChatHistory('assistant', aiResponse);
      setSuggestions(newSuggestions);
      
      // Scroll to bottom after AI response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      let errorMessage = 'Failed to get AI response. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMessage = 'AI request limit exceeded. Please try again in a few seconds.';
        } else if (error.message.includes('401')) {
          errorMessage = 'API authorization error. Please check access key.';
        } else if (error.message.includes('500')) {
          errorMessage = 'AI server temporarily unavailable. Please try later.';
        }
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="nutrition" size={28} color="#050508" />
          </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>AI NUTRITIONIST</Text>
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
          </View>
          
          {chatStarted && (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.endChatButton} onPress={endChat}>
                <Text style={styles.endChatText}>End chat</Text>
              </TouchableOpacity>
              <Text style={styles.chatTime}>{chatTime}</Text>
            </View>
          )}
        </View>

        {/* Welcome Message - Show only when chat hasn't started */}
        {!chatStarted && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <View style={styles.welcomeFeatures}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Ask questions about nutrition and diet</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Get calorie recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>I'll help you create a meal plan</Text>
              </View>
            </View>
          </View>
        )}

        {/* Date Separator - Show when chat is active */}
        {chatStarted && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</Text>
            </View>
          </View>
        )}

        {/* Chat Messages */}
        {chatStarted && (
          <View style={styles.chatContainer}>
            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageContainer,
                msg.isUser ? styles.userMessageContainer : styles.aiMessageContainer
              ]}>
                <View style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userMessageBubble : styles.aiMessageBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.isUser ? styles.userMessageText : styles.aiMessageText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <TypingDots />
              </View>
            )}
          </View>
        )}


        {/* Message Input - Back in ScrollView */}
        <View style={styles.messageInputContainer}>
          <View style={styles.messageInputWrapper}>
            <View style={styles.messageInput}>
              <TextInput
                style={styles.textInput}
                placeholder="Message"
                placeholderTextColor="#a1a1a1"
                value={message}
                onChangeText={setMessage}
                multiline
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#050508" />
              ) : (
                <Ionicons name="send" size={20} color="#050508" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Questions and AI Suggestions */}
        <View style={styles.quickQuestionsContainer}>
          <Text style={styles.quickQuestionsTitle}>
            {suggestions.length > 0 ? 'Suggested questions:' : 'Popular questions:'}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsScroll}
          >
            {(suggestions.length > 0 ? suggestions : quickQuestions).map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickQuestionButton, isLoading && styles.quickQuestionButtonDisabled]}
                onPress={() => handleQuickQuestion(question)}
                disabled={isLoading}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050508',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    width: 39,
    height: 39,
    backgroundColor: '#ffce00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 21.25,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 18.75,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  endChatButton: {
    backgroundColor: '#ff4656',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 40,
    justifyContent: 'center',
  },
  endChatText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
  },
  chatTime: {
    fontSize: 18,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'DIN Next LT Pro',
    lineHeight: 23.4,
    textAlign: 'center',
  },
  welcomeContainer: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeFeatures: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 8,
    height: 8,
    backgroundColor: '#ffce00',
    borderRadius: 4,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  dateSeparator: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dateContainer: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  chatContainer: {
    marginBottom: 20,
    gap: 16,
  },
  messageContainer: {
    gap: 8,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 12,
    padding: 16,
    maxWidth: '75%',
  },
  userMessageBubble: {
    backgroundColor: '#3b3b3b',
    alignSelf: 'flex-end',
  },
  aiMessageBubble: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 206, 0, 0.2)',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'flex-start',
    gap: 8,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffce00',
  },
  messageTime: {
    fontSize: 14,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'DIN Next LT Pro',
    lineHeight: 18.2,
    textAlign: 'center',
    alignSelf: 'center',
  },
  quickQuestionsContainer: {
    marginBottom: 40,
  },
  quickQuestionsTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#a1a1a1',
    fontFamily: 'Geologica',
    lineHeight: 22.1,
    marginBottom: 16,
  },
  quickQuestionsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  quickQuestionButton: {
    backgroundColor: '#1c1c1d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    minWidth: 154,
    height: 58,
    justifyContent: 'center',
  },
  quickQuestionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
  },
  messageInputContainer: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    marginBottom: 16,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#050508',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 100,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#ffffff',
    fontFamily: 'Geologica',
    lineHeight: 19.5,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#ffce00',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#a1a1a1',
  },
  quickQuestionButtonDisabled: {
    opacity: 0.5,
  },
});