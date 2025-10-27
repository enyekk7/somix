import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Filter, Grid, List, Sparkles, Heart, MessageCircle, ExternalLink, User } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../components/Button.jsx'
import { Avatar } from '../components/Avatar.jsx'
import { Spinner } from '../components/Spinner.jsx'
import { searchService } from '../services/search.js'

export function Search() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [activeFilter, setActiveFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    tags: []
  })
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState(null)

  const filters = [
    { id: 'all', label: 'All', count: searchResults.posts.length + searchResults.users.length },
    { id: 'posts', label: 'Posts', count: searchResults.posts.length },
    { id: 'users', label: 'Users', count: searchResults.users.length },
    { id: 'tags', label: 'Tags', count: searchResults.tags.length },
  ]

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId
      return (query) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            performSearch(query)
          } else {
            setSearchResults({ posts: [], users: [], tags: [] })
            setHasSearched(false)
          }
        }, 500)
      }
    })(),
    []
  )

  const performSearch = async (query) => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const results = await searchService.searchAll(query)
      setSearchResults({
        posts: results.posts.success ? results.posts.results : [],
        users: results.users.success ? results.users.users : [],
        tags: results.tags.success ? results.tags.tags : []
      })
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
      setSearchResults({ posts: [], users: [], tags: [] })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleUserClick = (user) => {
    navigate(`/profile/${user.address}`)
  }

  const handlePostClick = (post) => {
    // Navigate to post detail or open in modal
    console.log('Post clicked:', post)
  }

  const handleTagClick = (tag) => {
    setSearchQuery(tag)
    performSearch(tag)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <SearchIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Search</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for AI art, creators, or tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                debouncedSearch(e.target.value)
              }}
              onKeyPress={handleKeyPress}
              className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Filters</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={clsx(
                'px-4 py-2 rounded-xl font-medium transition-all duration-300',
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 pb-24">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg">{error}</p>
          </div>
        )}

        {hasSearched && !isLoading && !error && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Results for "{searchQuery}"
            </h3>

            {/* Users Results */}
            {activeFilter === 'all' || activeFilter === 'users' ? (
              searchResults.users.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Users ({searchResults.users.length})
                  </h4>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {searchResults.users.map((user) => (
                      <div 
                        key={user._id} 
                        onClick={() => handleUserClick(user)}
                        className="glass-effect rounded-2xl p-4 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            src={user.avatarUrl} 
                            alt={user.username}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{user.username}</p>
                            <p className="text-gray-400 text-sm truncate">{user.address}</p>
                            {user.bio && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{user.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}

            {/* Posts Results */}
            {activeFilter === 'all' || activeFilter === 'posts' ? (
              searchResults.posts.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-md font-semibold text-white mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Posts ({searchResults.posts.length})
                  </h4>
                  <div className={clsx(
                    'grid gap-6',
                    viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                  )}>
                    {searchResults.posts.map((post) => (
                      <div 
                        key={post._id} 
                        onClick={() => handlePostClick(post)}
                        className="glass-effect rounded-3xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                      >
                        <div className="relative">
                          <img
                            src={post.image?.url || post.image?.thumbUrl}
                            alt={post.caption}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button size="sm" className="bg-white/20 backdrop-blur-sm text-white">
                              <Sparkles className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-white font-semibold mb-2 line-clamp-2">{post.caption}</p>
                          <p className="text-gray-400 mb-4">by {post.author?.username}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags?.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-gray-400">
                              <span className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span>{post.likeCount}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.commentCount}</span>
                              </span>
                            </div>
                            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}

            {/* Tags Results */}
            {activeFilter === 'all' || activeFilter === 'tags' ? (
              searchResults.tags.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-md font-semibold text-white mb-4">Tags ({searchResults.tags.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.tags.map((tagData, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tagData.tag)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 text-sm rounded-full hover:bg-purple-500/30 transition-colors duration-200"
                      >
                        #{tagData.tag} ({tagData.count})
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : null}

            {/* No Results */}
            {searchResults.posts.length === 0 && searchResults.users.length === 0 && searchResults.tags.length === 0 && (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
                <p className="text-gray-500 text-sm mt-2">Try different keywords or check your spelling</p>
              </div>
            )}
          </div>
        )}

        {!hasSearched && !isLoading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float">
              <SearchIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Discover Amazing Content</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
              Search for AI-generated art, explore trending NFTs, or find your favorite creators
            </p>
            <div className="space-y-4">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl text-lg">
                <SearchIcon className="w-5 h-5 mr-2" />
                Start Searching
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}