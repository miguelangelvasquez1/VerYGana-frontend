import React from 'react';
import { Heart, MessageCircle, Share2, Gift, Users, Award, Calendar, Play, Eye } from 'lucide-react';

// Definir los tipos TypeScript
interface MediaContent {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface Comment {
  author: string;
  text: string;
  date: string;
}

interface Post {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  beneficiaries: number;
  likes: number;
  views?: number;
  amount?: number;
  winners?: string[];
  media?: MediaContent;
  comments?: Comment[];
}

interface CharityPostProps {
  post: Post;
}

const CharityPost: React.FC<CharityPostProps> = ({ post }) => {
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header de la publicación */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{post.title}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.date)}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{post.beneficiaries} beneficiados</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>
        </div>
      </div>

      {/* Contenido de la publicación */}
      <div className="p-4">
        <p className="text-gray-700 mb-4 leading-relaxed">{post.description}</p>
        
        {/* Media content */}
        {post.media && (
          <div className="relative rounded-xl overflow-hidden mb-4">
            {post.media.type === 'image' ? (
              <img 
                src={post.media.url} 
                alt={post.title}
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : post.media.type === 'video' ? (
              <div className="relative">
                <video 
                  src={post.media.url}
                  controls
                  className="w-full h-64 object-cover rounded-xl"
                  poster={post.media.thumbnail}
                >
                  Tu navegador no soporta videos HTML5.
                </video>
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded flex items-center space-x-1">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Video</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Ganadores destacados */}
        {post.winners && post.winners.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>Ganadores Destacados</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.winners.map((winner: string, index: number) => (
                <span key={index} className="bg-white text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-300">
                  {winner}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Información de la publicación (solo lectura) */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-500">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">{post.likes}</span>
              <span className="text-sm">Me gusta</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
              <span className="text-sm">Comentarios</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-500">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">{post.views || 0}</span>
              <span className="text-sm">Visualizaciones</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <span className="font-medium text-purple-600">${post.amount?.toLocaleString()}</span> invertidos
          </div>
        </div>

        {/* Mostrar comentarios existentes (solo lectura) */}
        {post.comments && post.comments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Comentarios de la comunidad:</h5>
            <div className="space-y-3">
              {post.comments.slice(0, 3).map((comment: Comment, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {comment.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                      <p className="font-semibold text-sm text-gray-800">{comment.author}</p>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.date)}</p>
                  </div>
                </div>
              ))}
              {post.comments.length > 3 && (
                <div className="text-center">
                  <span className="text-sm text-purple-600 font-medium">
                    +{post.comments.length - 3} comentarios más
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharityPost;