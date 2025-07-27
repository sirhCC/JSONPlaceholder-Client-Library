"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePrefetchComments = exports.usePrefetchUser = exports.usePrefetchPosts = exports.useDeletePost = exports.useUpdatePost = exports.useCreatePost = exports.useSearchUsers = exports.useUsersWithPagination = exports.useUser = exports.useUsers = exports.useSearchComments = exports.useCommentsByPost = exports.useCommentsWithPagination = exports.useComments = exports.usePostsByUser = exports.useSearchPosts = exports.usePostsWithPagination = exports.usePost = exports.usePosts = exports.useMutation = exports.useQuery = exports.useJsonPlaceholderClientOptional = exports.useJsonPlaceholderClient = exports.JsonPlaceholderProvider = void 0;
// Context and Provider
var context_1 = require("./context");
Object.defineProperty(exports, "JsonPlaceholderProvider", { enumerable: true, get: function () { return context_1.JsonPlaceholderProvider; } });
Object.defineProperty(exports, "useJsonPlaceholderClient", { enumerable: true, get: function () { return context_1.useJsonPlaceholderClient; } });
Object.defineProperty(exports, "useJsonPlaceholderClientOptional", { enumerable: true, get: function () { return context_1.useJsonPlaceholderClientOptional; } });
// Base hooks
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useQuery", { enumerable: true, get: function () { return hooks_1.useQuery; } });
Object.defineProperty(exports, "useMutation", { enumerable: true, get: function () { return hooks_1.useMutation; } });
// API-specific hooks
var api_hooks_1 = require("./api-hooks");
// Posts
Object.defineProperty(exports, "usePosts", { enumerable: true, get: function () { return api_hooks_1.usePosts; } });
Object.defineProperty(exports, "usePost", { enumerable: true, get: function () { return api_hooks_1.usePost; } });
Object.defineProperty(exports, "usePostsWithPagination", { enumerable: true, get: function () { return api_hooks_1.usePostsWithPagination; } });
Object.defineProperty(exports, "useSearchPosts", { enumerable: true, get: function () { return api_hooks_1.useSearchPosts; } });
Object.defineProperty(exports, "usePostsByUser", { enumerable: true, get: function () { return api_hooks_1.usePostsByUser; } });
// Comments
Object.defineProperty(exports, "useComments", { enumerable: true, get: function () { return api_hooks_1.useComments; } });
Object.defineProperty(exports, "useCommentsWithPagination", { enumerable: true, get: function () { return api_hooks_1.useCommentsWithPagination; } });
Object.defineProperty(exports, "useCommentsByPost", { enumerable: true, get: function () { return api_hooks_1.useCommentsByPost; } });
Object.defineProperty(exports, "useSearchComments", { enumerable: true, get: function () { return api_hooks_1.useSearchComments; } });
// Users
Object.defineProperty(exports, "useUsers", { enumerable: true, get: function () { return api_hooks_1.useUsers; } });
Object.defineProperty(exports, "useUser", { enumerable: true, get: function () { return api_hooks_1.useUser; } });
Object.defineProperty(exports, "useUsersWithPagination", { enumerable: true, get: function () { return api_hooks_1.useUsersWithPagination; } });
Object.defineProperty(exports, "useSearchUsers", { enumerable: true, get: function () { return api_hooks_1.useSearchUsers; } });
// Mutations
Object.defineProperty(exports, "useCreatePost", { enumerable: true, get: function () { return api_hooks_1.useCreatePost; } });
Object.defineProperty(exports, "useUpdatePost", { enumerable: true, get: function () { return api_hooks_1.useUpdatePost; } });
Object.defineProperty(exports, "useDeletePost", { enumerable: true, get: function () { return api_hooks_1.useDeletePost; } });
// Prefetching
Object.defineProperty(exports, "usePrefetchPosts", { enumerable: true, get: function () { return api_hooks_1.usePrefetchPosts; } });
Object.defineProperty(exports, "usePrefetchUser", { enumerable: true, get: function () { return api_hooks_1.usePrefetchUser; } });
Object.defineProperty(exports, "usePrefetchComments", { enumerable: true, get: function () { return api_hooks_1.usePrefetchComments; } });
//# sourceMappingURL=index.js.map