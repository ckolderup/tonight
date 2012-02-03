require 'rubygems'
require 'sinatra'
require 'data_mapper'
require 'haml'
require 'sass'
require 'sinatra/subdomain'

DataMapper.setup(:default, ENV['DATABASE_URL'] || "sqlite://#{Dir.pwd}/whos-in.db")

class Attending
  include DataMapper::Resource
  property :id,     Serial
  property :subdomain, Text
  property :name,   Text
  property :timestamp, DateTime
end

DataMapper.auto_upgrade!

class WhosIn < Sinatra::Application
  enable :sessions
  register Sinatra::Subdomain
  
  subdomain do
    get '/' do
      t = Date.today
      stale = Attending.all(:timestamp.lt => DateTime.new(t.year, t.month, t.day))
      stale.each { |a| a.destroy }
      
      @attending = Attending.all :subdomain => subdomain, :order => :timestamp.desc
      @added_id = session.delete :added_id
      
      haml :index
    end
    
    post '/add' do
      name = params[:name]
      name = 'Lazy Mystery Guest' if name.length == 0
      time = DateTime.now

      attendee = Attending.create(:name => name, :subdomain => subdomain, 
                                  :timestamp => time)

      session[:added_id] = attendee.id

      redirect '/', 303
    end

    post '/delete' do
      id = params[:id]

      victim = Attending.get(id)
      victim.destroy
     
      redirect '/', 303
    end
  end

  get '/' do
    "insert info page here"
  end

end
