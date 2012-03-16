require 'rubygems'
require 'sinatra'
require 'data_mapper'
require 'haml'
require 'sass'
require 'sinatra/subdomain'
require 'random-word'

DataMapper.setup(:default, ENV['DATABASE_URL'] || "sqlite://#{Dir.pwd}/tonight.db")

class Event
  include DataMapper::Resource
  property :id,        Serial
  property :subdomain, Text
  property :title,     Text
end

class Attending
  include DataMapper::Resource
  property :id,        Serial
  property :subdomain, Text
  property :name,      Text
  property :declined,  Boolean
  property :timestamp, DateTime
end

DataMapper.auto_upgrade!

class Tonight < Sinatra::Application
  enable :sessions
  register Sinatra::Subdomain
  set :haml, { :format => :html5, :ugly => true }
  set :sass, { :style => :compressed }
  
  before do
    @app_env = (request.host =~ /\.pm$/) ? :production : :development
  end
  
  subdomain do
    get '/' do
      if subdomain == "www"
        info_page
        exit
      end
      
      reset_page subdomain
      
      fetch_resources subdomain
      
      @added_id = session.delete :added_id

      haml :index
    end
    
    post '/' do
      fetch_resources subdomain
      
      @event.title = params[:title]
      @event.save
      
      redirect to('/')
    end
    
    get '/copy' do
      reset_page subdomain
      
      fetch_resources subdomain
      
      @output = {}
      
      [:in, :out].each do |group|
        @output[group] = (["#{@responders[group].size} #{group}:"] + @responders[group].map(&:name)).join("\n")
      end
      
      haml :copy
    end
        
    post '/add' do
      name = params[:name]
      name = 'Lazy Mystery Guest' if name.length == 0

      attendee = Attending.create \
        :name => name,
        :subdomain => subdomain, 
        :declined => !!params[:out],
        :timestamp => DateTime.now

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
    info_page
  end

  post '/generate' do
    redirect to("http://#{params[:slug]}.#{request.host}")
  end

  def info_page
    @info = true
    haml :info, :locals => {:rando => unoccupied_word}
  end
  
  def fetch_resources subdomain
    @event = Event.first :subdomain => subdomain
    @event ||= Event.create :subdomain => subdomain, :title => subdomain

    @responders = { :in => [], :out => [] }
    
    Attending.all(:subdomain => subdomain, :order => :timestamp.desc).each do |responder|
      @responders[responder.declined ? :out : :in] << responder
    end
  end

  def unoccupied_word
    begin
      rando = RandomWord.nouns.first.gsub('_','-')
      count = Attending.count(:subdomain => rando)
    end while count != 0
    rando
  end

  def reset_page subdomain
    oldest = Attending.first(:subdomain => subdomain, :order => :timestamp.asc) 
    return if oldest.nil?

    age_in_days = DateTime.now - oldest.timestamp
    return if age_in_days < 1.0

    stale = Attending.all(:subdomain => subdomain)
    stale.each { |a| a.destroy }
  end
end
