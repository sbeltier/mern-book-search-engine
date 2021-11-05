const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).populate('savedBooks')
        return userData
      }

      throw new AuthenticationError('Uh-oh.. you are not logged in')
    },
  },

  Mutation: {
    createNewUser: async (parent, args) => {
      const newUser = await User.create(args)
      const token = signToken(newUser)
      return { token, newUser }
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email })

      if (!user) {
        throw new AuthenticationError('Username and password did not match')
      }

      const correctPassword = await user.isCorrectPassword(password)

      if (!correctPassword) {
        throw new AuthenticationError('Username and password did not match')
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: bookData } },
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You must be logged in')
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      }
      throw new AuthenticationError('You must be logged in')
    },
  },
};

module.exports = resolvers;